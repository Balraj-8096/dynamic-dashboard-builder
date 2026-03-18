import { Injectable, signal } from '@angular/core';

import epxConfigData from '../test-cases/epx-config.json';
import epxMockData from '../test-cases/epx-mock-data.json';
import accountingConfigData from '../test-cases/accounting-config.json';
import accountingMockData from '../test-cases/accounting-mock-data.json';
import prescriptionsConfigData from '../test-cases/prescriptions-config.json';
import prescriptionsMockData from '../test-cases/prescriptions-mock-data.json';

import {
  ProductConfig, MockDatabase, EntityDef, FieldDef,
  JoinDef, GlobalFilterDimension,
  TableQueryConfig, TableQueryResult,
  StatQueryConfig, StatQueryResult,
  ChartQueryConfig, ChartQueryResult,
  PieQueryConfig, PieQueryResult,
  FilterCondition, FilterGroup, AggConfig,
  QueryWarning, ResultColumn,
  DateInterval, DateRangeValue, DateRangePreset,
  AggregationFunction, FilterOperator, QueryWarningCode, JoinType, SortDirection,
} from '../core/query-types';

/** Internal flat row: all columns from all joined entities.
 *  Keys use the logical field name: "entityName.fieldName"   */
type FlatRow = Record<string, unknown>;

/** Returns today as a local-midnight Date — always the real current date. */
function localToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable({ providedIn: 'root' })
export class QueryService {

  // ── Data registries ─────────────────────────────────────────────────────

  private readonly configs: Record<string, ProductConfig> = {
    'epx':           epxConfigData as unknown as ProductConfig,
    'accounting':    accountingConfigData as unknown as ProductConfig,
    'prescriptions': prescriptionsConfigData as unknown as ProductConfig,
  };

  private readonly databases: Record<string, MockDatabase> = {
    'epx':           epxMockData as unknown as MockDatabase,
    'accounting':    accountingMockData as unknown as MockDatabase,
    'prescriptions': prescriptionsMockData as unknown as MockDatabase,
  };

  // ── Global filters (dashboard-level, auto-applied to all queries) ────────

  readonly globalFilters = signal<FilterCondition[]>([]);

  setGlobalFilters(filters: FilterCondition[]): void { this.globalFilters.set(filters); }
  clearGlobalFilters(): void                          { this.globalFilters.set([]); }

  /** Returns distinct string values for a field — used to populate site filter dropdown. */
  getDistinctValues(product: string, entity: string, field: string): string[] {
    try {
      const config    = this.getConfig(product);
      const db        = this.getDatabase(product);
      const entityDef = this.findEntity(config, entity);
      const tableRows = db.schemas[entityDef.schema]?.[entityDef.table];
      if (!tableRows) return [];
      const fieldDef  = entityDef.fields.find(f => f.name === field);
      if (!fieldDef) return [];
      const values = new Set<string>();
      for (const row of tableRows) {
        const v = row[fieldDef.column];
        if (v != null) values.add(String(v));
      }
      return [...values].sort();
    } catch { return []; }
  }

  // ── Public query API ─────────────────────────────────────────────────────

  executeTableQuery(query: TableQueryConfig): TableQueryResult {
    const warnings: QueryWarning[] = [];
    const config = this.getConfig(query.product);

    let rows = this.executeJoins(query.product, query.entities, warnings);
    rows = this.applyFilterGroups(rows, this.mergedFilterGroups(query.entities, query.filterGroups, query.filters), config, warnings);

    if (query.sort) {
      const sortKey = `${query.sort.entity}.${query.sort.field}`;
      rows = [...rows].sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return query.sort!.direction === SortDirection.Desc ? -cmp : cmp;
      });
    }

    const totalRows = rows.length;
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.max(1, query.pageSize ?? 20);
    const paged = rows.slice((page - 1) * pageSize, page * pageSize);

    // Project to requested columns only
    const columns = this.buildResultColumns(query.columns, config);
    const projectedRows = paged.map(row => {
      const out: Record<string, unknown> = {};
      for (const col of query.columns) {
        const key = `${col.entity}.${col.field}`;
        out[key] = row[key] ?? null;
      }
      return out;
    });

    return { columns, rows: projectedRows, totalRows, page, pageSize, warnings };
  }

  executeStatQuery(query: StatQueryConfig): StatQueryResult {
    const warnings: QueryWarning[] = [];
    const config = this.getConfig(query.product);

    let rows = this.executeJoins(query.product, query.entities, warnings);
    rows = this.applyFilterGroups(rows, this.mergedFilterGroups(query.entities, query.filterGroups, query.filters), config, warnings);

    this.checkAVGNulls(rows, query.agg, warnings);
    const value = this.aggregate(rows, query.agg);

    let previousValue: number | undefined;
    let changePercent: number | undefined;
    let trendHistory: number[] | undefined;

    if (query.trend) {
      const { entity, field, interval, periods } = query.trend;
      const dateKey = `${entity}.${field}`;

      // Determine current period bounds from the date_range filter (if any)
      // or default to the most recent full period relative to MOCK_TODAY
      const [curFrom, curTo] = this.currentPeriodBounds(rows, dateKey, interval);
      const periodMs = curTo.getTime() - curFrom.getTime() + 86400_000;

      const prevFrom = new Date(curFrom.getTime() - periodMs * periods);
      const prevTo   = new Date(curTo.getTime()   - periodMs * periods);

      // All rows with other filters applied (no date filter — we need full history)
      let allRows = this.executeJoins(query.product, query.entities, []);
      allRows = this.applyFilterGroups(allRows, this.mergedFilterGroups(query.entities, query.filterGroups, query.filters), config, []);

      const prevRows = allRows.filter(r => {
        const v = r[dateKey];
        if (!v) return false;
        const d = new Date(v as string);
        return d >= prevFrom && d <= prevTo;
      });

      previousValue = this.aggregate(prevRows, query.agg);
      if (previousValue !== 0) {
        changePercent = ((value - previousValue) / Math.abs(previousValue)) * 100;
      }

      // Build spark-line history: aggregate per date bucket across all data
      const buckets = new Map<string, FlatRow[]>();
      for (const row of allRows) {
        const v = row[dateKey];
        if (v) {
          const bucket = this.formatDateBucket(v as string, interval);
          if (!buckets.has(bucket)) buckets.set(bucket, []);
          buckets.get(bucket)!.push(row);
        }
      }
      const sortedKeys = [...buckets.keys()].sort();
      trendHistory = sortedKeys.map(k => this.aggregate(buckets.get(k)!, query.agg));
    }

    // Derive period label from the first date_range filter that carries a label
    const allGroups = this.mergedFilterGroups(query.entities, query.filterGroups, query.filters);
    const allConditions = allGroups.flatMap(g => g.conditions);
    const computedPeriodLabel = allConditions.find(
      f => f.operator === FilterOperator.DateRange && f.label
    )?.label;

    return {
      value,
      formattedValue: this.formatValue(value, query.agg.function),
      previousValue,
      changePercent,
      trendHistory,
      computedPeriodLabel,
      warnings,
    };
  }

  executeChartQuery(query: ChartQueryConfig): ChartQueryResult {
    const warnings: QueryWarning[] = [];
    const config = this.getConfig(query.product);

    let rows = this.executeJoins(query.product, query.entities, warnings);
    rows = this.applyFilterGroups(rows, this.mergedFilterGroups(query.entities, query.filterGroups, query.filters), config, warnings);

    this.checkAVGNulls(rows, query.valueAgg, warnings);

    // ── Category chart (no dateAxis): groupBy is the x-axis ─────
    if (!query.dateAxis) {
      const groupKey = query.groupBy ? `${query.groupBy.entity}.${query.groupBy.field}` : null;
      if (!groupKey) return { labels: [], series: [], warnings };

      const allGroupValues = new Set<string>();
      for (const row of rows) {
        const gv = row[groupKey];
        allGroupValues.add(gv != null ? String(gv) : '(null)');
      }
      const labels = [...allGroupValues].sort();
      const data = labels.map(label => {
        const bucketRows = rows.filter(r => {
          const gv = r[groupKey];
          return (gv != null ? String(gv) : '(null)') === label;
        });
        return this.aggregate(bucketRows, query.valueAgg);
      });
      return { labels, series: [{ name: query.valueAgg.alias ?? query.valueAgg.function, data }], warnings };
    }

    // ── Date-axis chart ──────────────────────────────────────────
    const dateKey = `${query.dateAxis.entity}.${query.dateAxis.field}`;

    // Collect all date buckets in sorted order
    const allBuckets = new Set<string>();
    for (const row of rows) {
      const v = row[dateKey];
      if (v) allBuckets.add(this.formatDateBucket(v as string, query.dateAxis.interval));
    }
    const labels = [...allBuckets].sort();

    if (!query.groupBy) {
      // Single series
      const data = labels.map(label => {
        const bucketRows = rows.filter(r => {
          const v = r[dateKey];
          return v && this.formatDateBucket(v as string, query.dateAxis!.interval) === label;
        });
        return this.aggregate(bucketRows, query.valueAgg);
      });
      return { labels, series: [{ name: query.valueAgg.alias ?? query.valueAgg.function, data }], warnings };
    }

    // Multi-series: one series per groupBy value
    const groupKey = `${query.groupBy.entity}.${query.groupBy.field}`;
    const allGroupValues = new Set<string>();
    for (const row of rows) {
      const gv = row[groupKey];
      allGroupValues.add(gv != null ? String(gv) : '(null)');
    }
    const groupValues = [...allGroupValues].sort();

    const series = groupValues.map(gv => {
      const groupRows = rows.filter(r => {
        const v = r[groupKey];
        return (v != null ? String(v) : '(null)') === gv;
      });
      const data = labels.map(label => {
        const bucketRows = groupRows.filter(r => {
          const v = r[dateKey];
          return v && this.formatDateBucket(v as string, query.dateAxis!.interval) === label;
        });
        return this.aggregate(bucketRows, query.valueAgg);
      });
      return { name: gv, data };
    });

    return { labels, series, warnings };
  }

  executePieQuery(query: PieQueryConfig): PieQueryResult {
    const warnings: QueryWarning[] = [];
    const config = this.getConfig(query.product);

    let rows = this.executeJoins(query.product, query.entities, warnings);
    rows = this.applyFilterGroups(rows, this.mergedFilterGroups(query.entities, query.filterGroups, query.filters), config, warnings);

    this.checkAVGNulls(rows, query.valueAgg, warnings);
    const groupKey = `${query.groupBy.entity}.${query.groupBy.field}`;

    // Group rows
    const grouped = new Map<string, FlatRow[]>();
    for (const row of rows) {
      const gv = row[groupKey];
      const k = gv != null ? String(gv) : '(null)';
      if (!grouped.has(k)) grouped.set(k, []);
      grouped.get(k)!.push(row);
    }

    if (grouped.size > 8) {
      warnings.push({
        code: QueryWarningCode.HighCardinality,
        message: `Pie chart has ${grouped.size} segments (>8)`,
        detail: `Consider using topN to limit segments or switch to a bar chart`,
      });
    }

    // Find status_values for color lookup
    const fieldDef = this.findField(config, query.groupBy.entity, query.groupBy.field);

    // Build segments sorted by value descending
    let segments = [...grouped.entries()]
      .map(([label, segRows]) => ({
        label,
        value: this.aggregate(segRows, query.valueAgg),
        color: fieldDef?.status_values?.find(sv => sv.value === label)?.color,
      }))
      .sort((a, b) => b.value - a.value);

    if (query.topN && segments.length > query.topN) {
      const top = segments.slice(0, query.topN);
      const otherValue = segments.slice(query.topN).reduce((s, seg) => s + seg.value, 0);
      segments = [...top, { label: 'Other', value: otherValue, color: '#9ca3af' }];
    }

    return { segments, warnings };
  }

  /** Normalise global + query-level filters into an ordered list of FilterGroups.
   *  Global filters are prepended as a single AND group.
   *  When queryFilterGroups is present it takes precedence over legacyFilters. */
  private mergedFilterGroups(
    entities: string[],
    queryFilterGroups?: FilterGroup[],
    legacyFilters?: FilterCondition[],
  ): FilterGroup[] {
    const globalConds = this.globalFilters().filter(f => entities.includes(f.entity));
    const groups: FilterGroup[] = [];

    if (globalConds.length) {
      groups.push({ id: '__global__', logic: 'AND', conditions: globalConds });
    }
    if (queryFilterGroups?.length) {
      groups.push(...queryFilterGroups);
    } else if (legacyFilters?.length) {
      // Backward-compat: existing flat arrays become a single AND group
      groups.push({ id: '__legacy__', logic: 'AND', conditions: legacyFilters });
    }
    return groups;
  }

  // ── Join engine ──────────────────────────────────────────────────────────

  private executeJoins(product: string, entities: string[], warnings: QueryWarning[]): FlatRow[] {
    if (!entities.length) return [];
    const config = this.getConfig(product);
    const db = this.getDatabase(product);

    const rootDef = this.findEntity(config, entities[0]);
    let flatRows = this.loadEntityRows(rootDef, db);
    const joinedEntities = new Set<string>([entities[0]]);

    for (let i = 1; i < entities.length; i++) {
      const targetName = entities[i];

      // Find a join from any already-joined entity to targetName
      const joinDef = config.joins.find(j =>
        joinedEntities.has(j.from.entity) && j.to.entity === targetName
      );

      if (!joinDef) {
        warnings.push({
          code: QueryWarningCode.EntityNotReachable,
          message: `No join path found to entity '${targetName}'`,
          detail: `Ensure intermediate entities are included in the entities list`,
        });
        continue;
      }

      const leftEntityDef  = this.findEntity(config, joinDef.from.entity);
      const rightEntityDef = this.findEntity(config, targetName);
      const rightRows      = this.loadEntityRows(rightEntityDef, db);

      const leftFieldName  = this.columnToFieldName(leftEntityDef,  joinDef.from.column);
      const rightFieldName = this.columnToFieldName(rightEntityDef, joinDef.to.column);

      if (!leftFieldName || !rightFieldName) {
        warnings.push({
          code: QueryWarningCode.EntityNotReachable,
          message: `Join column mapping not found for join '${joinDef.name}'`,
          detail: `Check that column names in joins match entity field.column definitions`,
        });
        continue;
      }

      const leftKey  = `${joinDef.from.entity}.${leftFieldName}`;
      const rightKey = `${targetName}.${rightFieldName}`;

      // Index right rows by join key
      const rightIndex = new Map<unknown, FlatRow[]>();
      for (const rr of rightRows) {
        const k = rr[rightKey];
        if (!rightIndex.has(k)) rightIndex.set(k, []);
        rightIndex.get(k)!.push(rr);
      }

      const newRows: FlatRow[] = [];
      let hasLeftJoinNull = false;
      let hasFanOut = false;

      for (const lr of flatRows) {
        const lVal   = lr[leftKey];
        const matches = rightIndex.get(lVal) ?? [];

        if (matches.length === 0) {
          if (joinDef.type === JoinType.Left) {
            // Keep row but fill right-side columns with null
            const nullCols: FlatRow = {};
            for (const f of rightEntityDef.fields) {
              nullCols[`${targetName}.${f.name}`] = null;
            }
            newRows.push({ ...lr, ...nullCols });
            hasLeftJoinNull = true;
          }
          // INNER: discard the row (no match)
        } else {
          if (matches.length > 1) hasFanOut = true;
          for (const rr of matches) {
            newRows.push({ ...lr, ...rr });
          }
        }
      }

      if (hasLeftJoinNull) {
        warnings.push({
          code: QueryWarningCode.LeftJoinNull,
          message: `LEFT JOIN with '${targetName}' produced rows with NULL right-side columns`,
          detail: `Some '${joinDef.from.entity}' records have no matching '${targetName}' record`,
        });
      }
      if (hasFanOut) {
        warnings.push({
          code: QueryWarningCode.FanOutRisk,
          message: `One-to-many join with '${targetName}' multiplied rows`,
          detail: `SUM aggregations on '${joinDef.from.entity}' fields may be over-counted. Use the junction table's amount field instead.`,
        });
      }

      flatRows = newRows;
      joinedEntities.add(targetName);
    }

    return flatRows;
  }

  // ── Filter engine ────────────────────────────────────────────────────────

  /** Applies a list of FilterGroups to rows.
   *  Groups are ANDed together; conditions within each group use the group's logic (AND | OR). */
  private applyFilterGroups(
    rows: FlatRow[],
    groups: FilterGroup[],
    config: ProductConfig,
    warnings: QueryWarning[],
  ): FlatRow[] {
    for (const group of groups) {
      if (!group.conditions.length) continue;

      // Warn for non-filterable fields once per unique field
      for (const filter of group.conditions) {
        const fieldDef = this.findField(config, filter.entity, filter.field);
        if (fieldDef && !fieldDef.filterable) {
          warnings.push({
            code: QueryWarningCode.FilterOnNonFilterable,
            message: `Field '${filter.entity}.${filter.field}' is not marked as filterable`,
            detail: `Filtering may produce unexpected results or be unsupported in production`,
          });
        }
      }

      if (group.logic === 'OR') {
        rows = rows.filter(row =>
          group.conditions.some(f => this.matchesFilter(row[`${f.entity}.${f.field}`], f))
        );
      } else {
        // AND (default)
        rows = rows.filter(row =>
          group.conditions.every(f => this.matchesFilter(row[`${f.entity}.${f.field}`], f))
        );
      }
    }
    return rows;
  }

  /** Coerce filter.value string to match boolean/number field values. */
  private coerce(raw: unknown, filterVal: unknown): unknown {
    if (typeof raw === 'boolean') {
      if (filterVal === 'true')  return true;
      if (filterVal === 'false') return false;
    }
    if (typeof raw === 'number' && typeof filterVal === 'string') {
      const n = Number(filterVal);
      if (!isNaN(n)) return n;
    }
    return filterVal;
  }

  private matchesFilter(value: unknown, filter: FilterCondition): boolean {
    const cmp = this.coerce(value, filter.value);
    switch (filter.operator) {
      case FilterOperator.Eq:        return value === cmp;
      case FilterOperator.Neq:       return value !== cmp;
      case FilterOperator.In:        return (filter.values ?? []).includes(value);
      case FilterOperator.NotIn:     return !(filter.values ?? []).includes(value);
      case FilterOperator.Gt:        return value != null && (value as number) > (filter.value as number);
      case FilterOperator.Gte:       return value != null && (value as number) >= (filter.value as number);
      case FilterOperator.Lt:        return value != null && (value as number) < (filter.value as number);
      case FilterOperator.Lte:       return value != null && (value as number) <= (filter.value as number);
      case FilterOperator.IsNull:    return value == null;
      case FilterOperator.IsNotNull: return value != null;
      case FilterOperator.Contains:  return value != null && String(value).toLowerCase().includes(String(filter.value).toLowerCase());
      case FilterOperator.DateRange: return value != null && this.applyDateRange(value as string, filter.dateRange!);
    }
  }

  private applyDateRange(dateStr: string, range: DateRangeValue): boolean {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;

    let from: Date;
    let to: Date;

    if (range.preset) {
      [from, to] = this.calculatePresetRange(range.preset);
    } else {
      from = range.from ? new Date(range.from) : new Date('1900-01-01');
      to   = range.to   ? new Date(range.to + 'T23:59:59.999') : new Date('9999-12-31');
    }

    return date >= from && date <= to;
  }

  private calculatePresetRange(preset: DateRangePreset): [Date, Date] {
    const now  = new Date();
    const y    = now.getFullYear();
    const m    = now.getMonth();     // 0-based
    const d    = now.getDate();
    const dayMs = 86_400_000;

    // All bounds in LOCAL time — mock data strings also have no tz suffix so
    // new Date("2026-03-12T09:00:00") is local, keeping comparisons consistent.
    const today    = new Date(y, m, d, 0, 0, 0, 0);
    const todayEnd = new Date(y, m, d, 23, 59, 59, 999);

    switch (preset) {
      case DateRangePreset.Today:
        return [today, todayEnd];
      case DateRangePreset.Yesterday: {
        const yest = new Date(today.getTime() - dayMs);
        return [yest, new Date(yest.getFullYear(), yest.getMonth(), yest.getDate(), 23, 59, 59, 999)];
      }
      case DateRangePreset.Last7Days:
        return [new Date(today.getTime() - 6 * dayMs), todayEnd];
      case DateRangePreset.Last30Days:
        return [new Date(today.getTime() - 29 * dayMs), todayEnd];
      case DateRangePreset.Last90Days:
        return [new Date(today.getTime() - 89 * dayMs), todayEnd];
      case DateRangePreset.ThisMonth:
        return [new Date(y, m, 1), new Date(y, m + 1, 0, 23, 59, 59, 999)];
      case DateRangePreset.LastMonth:
        return [new Date(y, m - 1, 1), new Date(y, m, 0, 23, 59, 59, 999)];
      case DateRangePreset.ThisYear:
        return [new Date(y, 0, 1), new Date(y, 11, 31, 23, 59, 59, 999)];
      case DateRangePreset.LastYear:
        return [new Date(y - 1, 0, 1), new Date(y - 1, 11, 31, 23, 59, 59, 999)];
    }
  }

  // ── AVG null-check ────────────────────────────────────────────────────────

  /** Emits AVG_INCLUDES_NULLS when AVG is requested and the field contains null values.
   *  Call once per query, before any grouping/aggregation loop. */
  private checkAVGNulls(rows: FlatRow[], agg: AggConfig, warnings: QueryWarning[]): void {
    if (agg.function !== AggregationFunction.Avg) return;
    const key = `${agg.entity}.${agg.field}`;
    const nullCount = rows.filter(r => r[key] == null).length;
    if (nullCount > 0) {
      warnings.push({
        code: QueryWarningCode.AvgIncludesNulls,
        message: `AVG(${agg.entity}.${agg.field}) excludes ${nullCount} NULL value(s)`,
        detail: `${nullCount} row(s) had null values and were excluded from the average. Common after LEFT JOINs.`,
      });
    }
  }

  // ── Aggregation ──────────────────────────────────────────────────────────

  private aggregate(rows: FlatRow[], agg: AggConfig): number {
    const key = `${agg.entity}.${agg.field}`;
    const values = rows.map(r => r[key]);

    switch (agg.function) {
      case AggregationFunction.Count:
        return rows.length;
      case AggregationFunction.CountDistinct:
        return new Set(values).size;
      case AggregationFunction.Sum:
        return values.reduce<number>((s, v) => s + (v != null ? (v as number) : 0), 0);
      case AggregationFunction.Avg: {
        const nonNull = values.filter(v => v != null) as number[];
        return nonNull.length ? nonNull.reduce((s, v) => s + v, 0) / nonNull.length : 0;
      }
      case AggregationFunction.Min: {
        const nonNull = values.filter(v => v != null) as number[];
        return nonNull.length ? Math.min(...nonNull) : 0;
      }
      case AggregationFunction.Max: {
        const nonNull = values.filter(v => v != null) as number[];
        return nonNull.length ? Math.max(...nonNull) : 0;
      }
    }
  }

  // ── Date bucketing ───────────────────────────────────────────────────────

  private formatDateBucket(dateStr: string, interval: DateInterval): string {
    const d = new Date(dateStr);
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth(); // 0-based
    const day = d.getUTCDate();

    switch (interval) {
      case DateInterval.Day:
        return `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      case DateInterval.Week: {
        // ISO week number
        const jan4 = new Date(Date.UTC(y, 0, 4));
        const dayOfYear = Math.floor((d.getTime() - Date.UTC(y, 0, 1)) / 86_400_000) + 1;
        const weekNum = Math.ceil((dayOfYear + jan4.getUTCDay()) / 7);
        return `${y}-W${String(weekNum).padStart(2, '0')}`;
      }
      case DateInterval.Month:
        return `${y}-${String(m + 1).padStart(2, '0')}`;
      case DateInterval.Quarter:
        return `${y}-Q${Math.floor(m / 3) + 1}`;
      case DateInterval.Year:
        return `${y}`;
    }
  }

  /** Returns [minDate, maxDate] of a date field across all rows, used for trend period calculation */
  private currentPeriodBounds(rows: FlatRow[], dateKey: string, _interval: DateInterval): [Date, Date] {
    const dates = rows
      .map(r => r[dateKey])
      .filter(v => v != null)
      .map(v => new Date(v as string))
      .filter(d => !isNaN(d.getTime()));

    const fallback = localToday();
    if (!dates.length) return [fallback, fallback];
    const min = new Date(Math.min(...dates.map(d => d.getTime())));
    const max = new Date(Math.max(...dates.map(d => d.getTime())));
    min.setHours(0, 0, 0, 0);
    max.setHours(23, 59, 59, 999);
    return [min, max];
  }

  // ── Data loaders ─────────────────────────────────────────────────────────

  private loadEntityRows(entity: EntityDef, db: MockDatabase): FlatRow[] {
    const schemaData = db.schemas[entity.schema];
    if (!schemaData) return [];
    const tableRows = schemaData[entity.table];
    if (!tableRows) return [];

    return tableRows.map(dbRow => {
      const flatRow: FlatRow = {};
      for (const field of entity.fields) {
        flatRow[`${entity.name}.${field.name}`] = dbRow[field.column] ?? null;
      }
      return flatRow;
    });
  }

  // ── Config helpers ───────────────────────────────────────────────────────

  getConfig(product: string): ProductConfig {
    const cfg = this.configs[product];
    if (!cfg) throw new Error(`Unknown product: '${product}'. Available: ${Object.keys(this.configs).join(', ')}`);
    return cfg;
  }

  getDatabase(product: string): MockDatabase {
    const db = this.databases[product];
    if (!db) throw new Error(`No mock database for product: '${product}'`);
    return db;
  }

  // ── Schema explorer API (used by widget wizard to populate dropdowns) ────

  getProductList(): Array<{ slug: string; display_name: string }> {
    return Object.values(this.configs).map(c => ({
      slug: c.product.slug,
      display_name: c.product.display_name,
    }));
  }

  getEntityList(product: string): EntityDef[] {
    return this.getConfig(product).entities;
  }

  getFieldList(product: string, entityName: string): FieldDef[] {
    return this.findEntity(this.getConfig(product), entityName).fields;
  }

  // ── Join graph helpers (used by query-builder UI components) ────────────

  /** BFS: returns all EntityDef reachable from the given seed entities via joins. */
  getReachableEntities(product: string, fromEntities: string[]): EntityDef[] {
    const seeds = fromEntities.filter(Boolean);
    if (!seeds.length) return this.getConfig(product).entities;
    const config   = this.getConfig(product);
    const reachable = new Set<string>(seeds);
    let changed = true;
    while (changed) {
      changed = false;
      for (const j of config.joins) {
        if (reachable.has(j.from.entity) && !reachable.has(j.to.entity)) {
          reachable.add(j.to.entity);
          changed = true;
        }
      }
    }
    return config.entities.filter(e => reachable.has(e.name));
  }

  /** Returns the ordered entity list (with intermediate junction entities)
   *  needed to connect all `required` entities through join paths.
   *  Deduplicates and inserts intermediaries automatically. */
  buildEntityPath(product: string, required: string[]): string[] {
    const unique = [...new Set(required.filter(Boolean))];
    if (!unique.length) return [];
    if (unique.length === 1) return unique;

    const config  = this.getConfig(product);
    const inPath  = new Set<string>([unique[0]]);
    const order   = [unique[0]];

    for (const target of unique.slice(1)) {
      if (inPath.has(target)) continue;

      // BFS from currently known entities to reach `target`
      const queue: string[]            = [...inPath];
      const parent = new Map<string, string>();
      inPath.forEach(e => parent.set(e, ''));
      let found = false;

      outer: while (queue.length) {
        const cur = queue.shift()!;
        for (const j of config.joins) {
          if (j.from.entity === cur && !parent.has(j.to.entity)) {
            parent.set(j.to.entity, cur);
            if (j.to.entity === target) { found = true; break outer; }
            queue.push(j.to.entity);
          }
        }
      }

      if (!found) { order.push(target); inPath.add(target); continue; }

      // Trace back through BFS parent map, insert intermediaries in order
      const path: string[] = [];
      let node = target;
      while (node && !inPath.has(node)) {
        path.unshift(node);
        node = parent.get(node) ?? '';
      }
      for (const e of path) { order.push(e); inPath.add(e); }
    }

    return order;
  }

  getGlobalFilterDimensions(product: string): GlobalFilterDimension[] {
    return this.getConfig(product).global_filter_dimensions;
  }

  getJoins(product: string): JoinDef[] {
    return this.getConfig(product).joins;
  }

  private findEntity(config: ProductConfig, name: string): EntityDef {
    const entity = config.entities.find(e => e.name === name);
    if (!entity) throw new Error(`Entity '${name}' not found in product '${config.product.slug}'`);
    return entity;
  }

  findField(config: ProductConfig, entityName: string, fieldName: string): FieldDef | undefined {
    return config.entities
      .find(e => e.name === entityName)
      ?.fields.find(f => f.name === fieldName);
  }

  private columnToFieldName(entity: EntityDef, column: string): string | undefined {
    return entity.fields.find(f => f.column === column)?.name;
  }

  private buildResultColumns(
    columns: Array<{ entity: string; field: string }>,
    config: ProductConfig,
  ): ResultColumn[] {
    return columns.map(col => {
      const fieldDef = this.findField(config, col.entity, col.field);
      return {
        key: `${col.entity}.${col.field}`,
        label: fieldDef ? this.toLabel(col.entity, col.field) : `${col.entity}.${col.field}`,
        type: fieldDef?.type ?? 'string' as any,
        statusValues: fieldDef?.status_values,
      };
    });
  }

  private toLabel(entity: string, field: string): string {
    return field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  private formatValue(value: number, fn: AggregationFunction): string {
    if (fn === AggregationFunction.Count || fn === AggregationFunction.CountDistinct) {
      return String(Math.round(value));
    }
    if (Number.isInteger(value)) return value.toLocaleString();
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
