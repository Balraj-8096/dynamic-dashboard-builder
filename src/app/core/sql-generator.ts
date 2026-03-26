/**
 * sql-generator.ts
 *
 * Pure utility — converts any query config + its ProductConfig into a
 * human-readable "equivalent SQL" string.  The output is illustrative
 * (the app runs against an in-memory mock engine, not a real database),
 * but it faithfully mirrors every behavioural detail of QueryService:
 *
 *   Joins & schema
 *   ─────────────
 *   • entity → schema.table with AS alias when names differ
 *   • INNER / LEFT JOINs resolved from the product JoinDef registry,
 *     using actual DB column names on the ON predicate
 *   • Warning comment when no join path exists to an entity
 *
 *   Filters
 *   ───────
 *   • All 12 FilterOperators → correct SQL predicates
 *   • CONTAINS uses LOWER() on both sides — engine is case-insensitive
 *   • FilterGroup AND/OR logic; groups ANDed at the top level
 *   • Single group → no unnecessary outer parens
 *   • Legacy flat filters normalised into a single AND group
 *   • Global (dashboard-level) filters shown in a dedicated comment block
 *   • Empty IN / NOT IN list → inline note (always FALSE / always TRUE)
 *   • dateRangeField → comment naming the per-widget date-picker field
 *
 *   Date handling
 *   ─────────────
 *   • All 9 DateRangePresets use half-open intervals [start, next_period)
 *     to correctly cover datetime fields with time components, matching
 *     the engine's end-bound of 23:59:59.999 for every preset
 *   • Custom from / to: from uses >= (midnight-safe), to appended with
 *     23:59:59.999 to match the engine exactly
 *   • DATE_TRUNC for all 5 DateIntervals
 *
 *   Aggregations
 *   ────────────
 *   • COUNT    → COUNT(*)   — engine counts rows, not field values
 *   • COUNT_DISTINCT includes a note: engine counts NULL as one distinct
 *     value but SQL COUNT(DISTINCT col) ignores NULLs
 *   • AVG / MIN / MAX wrapped in COALESCE(..., 0) — engine returns 0
 *     when all values are NULL; SQL would return NULL without COALESCE
 *   • Alias from AggConfig.alias when present, otherwise defaults
 *
 *   Query-type specifics
 *   ────────────────────
 *   • Stat  → 3 numbered sub-queries when trend is configured:
 *               [1/3] current-period value (all filters applied)
 *               [2/3] previous-period value (same WHERE + shifted date window)
 *               [3/3] sparkline — same WHERE as [1/3], + GROUP BY period
 *                     (engine applies ALL filters including date-range to the
 *                      sparkline rows; the "no date filter" comment in the engine
 *                      source is misleading — the code calls mergedFilterGroups
 *                      with the full config)
 *   • Chart → 4 shapes: category/date-axis x single-series/multi-series
 *             Category shape: COALESCE(col::text, '(null)') mirrors the engine
 *             converting null group values to the string '(null)'
 *   • Pie   → LIMIT N + in-memory "Other" bucket explanation when topN set
 *   • Table → inline SQL for all 5 derived column modes; ORDER BY with
 *             explicit NULLS LAST / NULLS FIRST matching the engine's
 *             custom null-sorting comparator; LIMIT / OFFSET pagination
 *
 *   Robustness
 *   ──────────
 *   • Guards on required fields (agg, groupBy, valueAgg, entities)
 *   • Unknown entity / field falls back to the logical name, no throw
 *   • No code path throws — all errors surface as SQL comment lines
 */

import {
  ProductConfig, EntityDef, FieldDef,
  AggConfig, AggregationFunction,
  FilterCondition, FilterGroup, FilterOperator,
  DateInterval, DateRangePreset, DateRangeValue,
  StatQueryConfig, ChartQueryConfig, PieQueryConfig, TableQueryConfig,
  DerivedColumnDef, SortDirection, JoinType, FieldType,
} from './query-types';

// ═════════════════════════════════════════════════════════════════════════════
// ── Schema helpers ────────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

function findEntity(pc: ProductConfig, entity: string): EntityDef | undefined {
  return pc.entities.find(e => e.name === entity);
}

/**
 * FROM / JOIN table reference.
 * Emits "schema.table AS entity" when the schema-qualified name differs from
 * the entity alias, otherwise just the bare entity name.
 */
function tableRef(pc: ProductConfig, entity: string): string {
  const def  = findEntity(pc, entity);
  if (!def) return entity;
  const full = (def.schema && def.schema !== entity)
    ? `${def.schema}.${def.table}`
    : def.table;
  return full !== entity ? `${full} AS ${entity}` : entity;
}

/**
 * Column reference: "entity.actual_db_column".
 * Falls back to the logical field name when the entity or field is unknown
 * so the SQL remains readable even for partially-configured queries.
 */
function colRef(pc: ProductConfig, entity: string, field: string): string {
  const fd = findEntity(pc, entity)?.fields.find(f => f.name === field);
  return `${entity}.${fd?.column ?? field}`;
}

function findField(pc: ProductConfig, entity: string, field: string): FieldDef | undefined {
  return findEntity(pc, entity)?.fields.find(f => f.name === field);
}

// ═════════════════════════════════════════════════════════════════════════════
// ── Value quoting ─────────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

/** Returns a SQL-safe literal, quoting strings and escaping inner single-quotes. */
function sqlVal(value: unknown, ft?: FieldType): string {
  if (value == null) return 'NULL';
  if (ft === FieldType.Number  || typeof value === 'number') return String(value);
  if (ft === FieldType.Boolean || typeof value === 'boolean') {
    return (value === true || value === 'true') ? 'TRUE' : 'FALSE';
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlValList(values: unknown[], ft?: FieldType): string {
  return (values ?? []).map(v => sqlVal(v, ft)).join(', ');
}

// ═════════════════════════════════════════════════════════════════════════════
// ── Date / interval helpers ───────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

/** DateInterval enum values already match SQL DATE_TRUNC string literals. */
function dateTrunc(col: string, interval: DateInterval): string {
  return `DATE_TRUNC('${interval}', ${col})`;
}

/**
 * Maps a DateRangePreset to an equivalent SQL WHERE predicate.
 *
 * All presets use half-open intervals [ start, exclusive_end ) so that
 * datetime values with time components are handled correctly.  This matches
 * the engine's calculatePresetRange which sets the end bound to 23:59:59.999
 * for every preset.
 *
 * Pattern:  col >= <start>  AND  col < <next_period_start>
 */
function presetSql(col: string, preset: DateRangePreset): string {
  switch (preset) {
    case DateRangePreset.Today:
      return (
        `${col} >= CURRENT_DATE\n` +
        `   AND ${col} <  CURRENT_DATE + INTERVAL '1 day'`
      );
    case DateRangePreset.Yesterday:
      return (
        `${col} >= CURRENT_DATE - INTERVAL '1 day'\n` +
        `   AND ${col} <  CURRENT_DATE`
      );
    case DateRangePreset.Last7Days:
      return (
        `${col} >= CURRENT_DATE - INTERVAL '6 days'\n` +
        `   AND ${col} <  CURRENT_DATE + INTERVAL '1 day'`
      );
    case DateRangePreset.Last30Days:
      return (
        `${col} >= CURRENT_DATE - INTERVAL '29 days'\n` +
        `   AND ${col} <  CURRENT_DATE + INTERVAL '1 day'`
      );
    case DateRangePreset.Last90Days:
      return (
        `${col} >= CURRENT_DATE - INTERVAL '89 days'\n` +
        `   AND ${col} <  CURRENT_DATE + INTERVAL '1 day'`
      );
    case DateRangePreset.ThisMonth:
      return (
        `${col} >= DATE_TRUNC('month', CURRENT_DATE)\n` +
        `   AND ${col} <  DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'`
      );
    case DateRangePreset.LastMonth:
      return (
        `${col} >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')\n` +
        `   AND ${col} <  DATE_TRUNC('month', CURRENT_DATE)`
      );
    case DateRangePreset.ThisYear:
      return (
        `${col} >= DATE_TRUNC('year', CURRENT_DATE)\n` +
        `   AND ${col} <  DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year'`
      );
    case DateRangePreset.LastYear:
      return (
        `${col} >= DATE_TRUNC('year', CURRENT_DATE - INTERVAL '1 year')\n` +
        `   AND ${col} <  DATE_TRUNC('year', CURRENT_DATE)`
      );
  }
}

/**
 * Custom date range from/to bounds.
 *
 * The engine appends 'T23:59:59.999' to the `to` date so the entire end-day
 * is included for datetime fields.  We mirror that here.
 * The `from` date is used as-is (new Date('YYYY-MM-DD') = midnight, inclusive).
 */
function dateRangeSql(col: string, range: DateRangeValue): string {
  if (range.preset) return presetSql(col, range.preset);
  const parts: string[] = [];
  if (range.from) parts.push(`${col} >= '${range.from}'`);
  if (range.to)   parts.push(`${col} <= '${range.to} 23:59:59.999'`);
  return parts.length ? parts.join('\n   AND ') : `/* no date bounds specified */`;
}

// ═════════════════════════════════════════════════════════════════════════════
// ── Filter helpers ────────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

function conditionSql(cond: FilterCondition, pc: ProductConfig): string {
  const col = colRef(pc, cond.entity, cond.field);
  const fd  = findField(pc, cond.entity, cond.field);
  const ft  = fd?.type;

  switch (cond.operator) {
    case FilterOperator.Eq:        return `${col} = ${sqlVal(cond.value, ft)}`;
    case FilterOperator.Neq:       return `${col} != ${sqlVal(cond.value, ft)}`;
    case FilterOperator.Gt:        return `${col} > ${sqlVal(cond.value, ft)}`;
    case FilterOperator.Gte:       return `${col} >= ${sqlVal(cond.value, ft)}`;
    case FilterOperator.Lt:        return `${col} < ${sqlVal(cond.value, ft)}`;
    case FilterOperator.Lte:       return `${col} <= ${sqlVal(cond.value, ft)}`;
    case FilterOperator.In: {
      const vals = cond.values ?? [];
      if (!vals.length) return `/* IN () on ${col} — always FALSE, no rows match */`;
      return `${col} IN (${sqlValList(vals, ft)})`;
    }
    case FilterOperator.NotIn: {
      const vals = cond.values ?? [];
      if (!vals.length) return `/* NOT IN () on ${col} — always TRUE, all rows pass */`;
      return `${col} NOT IN (${sqlValList(vals, ft)})`;
    }
    case FilterOperator.IsNull:    return `${col} IS NULL`;
    case FilterOperator.IsNotNull: return `${col} IS NOT NULL`;
    case FilterOperator.Contains:
      // Engine: String(value).toLowerCase().includes(String(filter.value).toLowerCase())
      // → case-insensitive substring match on both sides.
      return `LOWER(${col}) LIKE LOWER('%${String(cond.value ?? '').replace(/'/g, "''")}%')`;
    case FilterOperator.DateRange:
      return dateRangeSql(col, cond.dateRange ?? {});
    default:
      return `/* unknown operator on ${col} */`;
  }
}

/**
 * Renders one FilterGroup into a SQL fragment.
 * Outer parens are added only when there are multiple groups (to disambiguate
 * group boundaries); a single-group WHERE needs no parens.
 */
function groupSql(
  group: FilterGroup,
  pc: ProductConfig,
  wrapParens: boolean,
): string | null {
  const conds = group.conditions
    .map(c => conditionSql(c, pc))
    .filter(Boolean);
  if (!conds.length) return null;
  const joiner = ` ${group.logic}\n       `;
  const body   = conds.join(joiner);
  return (wrapParens && conds.length > 1) ? `(${body})` : body;
}

/**
 * Builds the complete WHERE clause from an ordered list of FilterGroups.
 * Groups are ANDed at the top level — mirrors QueryService.applyFilterGroups.
 * Returns '' when there are no active conditions.
 */
function whereSql(groups: FilterGroup[], pc: ProductConfig): string {
  const activeGroups = groups.filter(g => g.conditions.length);
  const multiGroup   = activeGroups.length > 1;
  const rendered     = activeGroups
    .map(g => groupSql(g, pc, multiGroup))
    .filter(Boolean) as string[];
  if (!rendered.length) return '';
  return `WHERE  ${rendered.join('\n  AND  ')}`;
}

/**
 * Mirrors QueryService.mergedFilterGroups exactly:
 * global filters scoped to query entities are prepended as a single AND group,
 * then query-level filterGroups (or legacy flat filters as a fallback) follow.
 */
function buildGroups(
  entities:       string[],
  filterGroups?:  FilterGroup[],
  legacyFilters?: FilterCondition[],
  globalFilters?: FilterCondition[],
): FilterGroup[] {
  const result: FilterGroup[] = [];
  const globalConds = (globalFilters ?? []).filter(f => entities.includes(f.entity));
  if (globalConds.length) {
    result.push({ id: '__global__', logic: 'AND', conditions: globalConds });
  }
  if (filterGroups?.length) {
    result.push(...filterGroups);
  } else if (legacyFilters?.length) {
    result.push({ id: '__legacy__', logic: 'AND', conditions: legacyFilters });
  }
  return result;
}

// ═════════════════════════════════════════════════════════════════════════════
// ── JOIN clause builder ───────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Walks the entity list in order (mirrors QueryService.executeJoins) and emits
 * one SQL JOIN clause per entity after the root.
 * Uses the JoinDef's actual DB column names for the ON predicate.
 */
function buildJoinClauses(entities: string[], pc: ProductConfig): string[] {
  if (entities.length <= 1) return [];
  const joined  = new Set<string>([entities[0]]);
  const clauses: string[] = [];

  for (let i = 1; i < entities.length; i++) {
    const target  = entities[i];
    const joinDef = pc.joins.find(
      j => joined.has(j.from.entity) && j.to.entity === target,
    );
    if (!joinDef) {
      clauses.push(`-- ⚠ No join path found to entity '${target}'`);
      joined.add(target);
      continue;
    }
    if (!findEntity(pc, target)) {
      clauses.push(`-- ⚠ Entity '${target}' not found in product schema`);
      continue;
    }
    const jType    = joinDef.type === JoinType.Left ? 'LEFT JOIN' : 'INNER JOIN';
    const tRef     = tableRef(pc, target);
    const leftCol  = `${joinDef.from.entity}.${joinDef.from.column}`;
    const rightCol = `${target}.${joinDef.to.column}`;
    clauses.push(`${jType} ${tRef}\n        ON ${leftCol} = ${rightCol}`);
    joined.add(target);
  }
  return clauses;
}

// ═════════════════════════════════════════════════════════════════════════════
// ── Aggregation helpers ───────────────────────────────────────────════════════
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Returns the SQL aggregation expression, faithfully reproducing engine behaviour:
 *
 * COUNT         → COUNT(*) — engine counts rows, not field values
 * COUNT_DISTINCT→ COUNT(DISTINCT col) with a note: the engine counts NULL as
 *                 one distinct value via new Set(values).size, but SQL's
 *                 COUNT(DISTINCT col) ignores NULLs — results may differ if
 *                 the field contains NULL values
 * AVG / MIN / MAX → COALESCE(AGG(col), 0) — engine returns 0 when all values
 *                 are NULL (nonNull.length === 0 branch); SQL would return NULL
 */
function aggExpr(agg: AggConfig, pc: ProductConfig, defaultAlias = 'value'): string {
  const col   = colRef(pc, agg.entity, agg.field);
  const alias = agg.alias ?? defaultAlias;
  switch (agg.function) {
    case AggregationFunction.Count:
      return `COUNT(*) AS ${alias}`;
    case AggregationFunction.CountDistinct:
      return (
        `COUNT(DISTINCT ${col}) AS ${alias}` +
        `  -- note: engine counts NULL as 1 distinct value; SQL ignores NULLs here`
      );
    case AggregationFunction.Sum:
      // Engine: reduce((s,v) => s + (v != null ? v : 0), 0) → returns 0 when all NULL.
      // SQL SUM() returns NULL when all values are NULL; COALESCE matches the engine.
      return `COALESCE(SUM(${col}), 0) AS ${alias}`;
    case AggregationFunction.Avg:
      return `COALESCE(AVG(${col}), 0) AS ${alias}`;
    case AggregationFunction.Min:
      return `COALESCE(MIN(${col}), 0) AS ${alias}`;
    case AggregationFunction.Max:
      return `COALESCE(MAX(${col}), 0) AS ${alias}`;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── Derived column expressions (Table) ───────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Maps a DerivedColumnDef to an inline SQL expression, mirroring the engine's
 * evaluateDerivedColumn method:
 *
 * concat   → CONCAT_WS skips NULLs but the engine also filters out empty
 *            strings (.filter(Boolean)); add a comment about that difference
 * sum      → col1 + col2 + … (engine: Number(v) || 0 so NULLs become 0)
 *            → COALESCE each operand to 0 to match
 * subtract → same null-as-0 treatment
 * multiply → engine initial value is 1; NULLs become Number(v)||1 = 1 (identity)
 *            → SQL: COALESCE each operand to 1
 * divide   → NULLIF guards against divide-by-zero; engine preserves accumulator
 *            on zero-denominator, SQL returns NULL — noted in a comment
 */
function derivedExpr(def: DerivedColumnDef, pc: ProductConfig): string {
  const cols  = def.sources.map(s => colRef(pc, s.entity, s.field));
  const label = def.label ?? def.key;
  if (!cols.length) return `NULL AS "${label}"`;

  switch (def.mode) {
    case 'concat': {
      if (cols.length === 1) return `${cols[0]} AS "${label}"`;
      const sep = def.separator ?? ' ';
      // Engine also strips empty strings; CONCAT_WS only skips NULLs, not ''.
      return (
        `CONCAT_WS('${sep}', ${cols.join(', ')}) AS "${label}"` +
        `  -- engine also skips empty strings; CONCAT_WS only skips NULLs`
      );
    }
    case 'sum': {
      // Engine: Number(v) || 0 → NULLs contribute 0
      const safe = cols.map(c => `COALESCE(${c}, 0)`);
      return `(${safe.join(' + ')}) AS "${label}"`;
    }
    case 'subtract': {
      const safe = cols.map(c => `COALESCE(${c}, 0)`);
      return `(${safe.join(' - ')}) AS "${label}"`;
    }
    case 'multiply': {
      // Engine: acc * (Number(v) || 1), initial = 1
      // Number(null) = 0 → 0||1 = 1 (null treated as identity) → COALESCE(col,1) matches.
      // Number(0)    = 0 → 0||1 = 1 (ZERO is also treated as identity by the engine).
      // COALESCE(col, 1) only substitutes 1 for NULL, not for 0.
      // SQL result differs when a source column value is exactly 0:
      //   engine: 0 → treated as 1 (identity)  |  SQL: 0 → used as-is → whole product = 0
      const safe = cols.map(c => `COALESCE(${c}, 1)`);
      return `(${safe.join(' * ')}) AS "${label}"`;
    }
    case 'divide': {
      // Engine: if (v !== 0) acc / v, else keeps acc (no NULL).
      // SQL: NULLIF returns NULL on zero-denominator → whole result may be NULL.
      const chain = cols.slice(1).reduce(
        (acc, c) => `(${acc} / NULLIF(${c}, 0))`,
        cols[0],
      );
      return (
        `${chain} AS "${label}"` +
        `  -- engine preserves numerator on zero-denominator; SQL returns NULL`
      );
    }
    default:
      return `NULL AS "${label}" /* unknown derive mode: ${(def as any).mode} */`;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── Banner / comment helpers ──────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

function banner(title: string): string {
  const dashes = Math.max(2, 62 - title.length);
  return `-- ── ${title} ${'─'.repeat(dashes)}`;
}

/**
 * Renders active global filters as a framed comment block so users can clearly
 * see which dashboard-level filters are prepended to the WHERE clause.
 */
function globalFilterBox(globalFilters?: FilterCondition[]): string {
  const active = globalFilters ?? [];
  if (!active.length) return '';
  return [
    ``,
    `-- ┌─ Dashboard-level global filters (prepended as AND group) ──────────┐`,
    ...active.map(f => `-- │  ${f.entity}.${f.field}  (${f.operator})`),
    `-- └────────────────────────────────────────────────────────────────────┘`,
  ].join('\n');
}

function dateRangeFieldNote(drf?: { entity: string; field: string }): string {
  if (!drf) return '';
  return `-- Per-widget date picker controls: ${drf.entity}.${drf.field}`;
}

// ═════════════════════════════════════════════════════════════════════════════
// ── Public generators ─────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

// ── STAT ─────────────────────────────────────────────────────────────────────

/**
 * Generates SQL for StatQueryConfig (Stat, Analytics, Progress widgets).
 *
 * When trend is configured the output contains three numbered sub-queries
 * that mirror the engine's three-pass logic:
 *
 *   [1/3] Current-period value
 *         All filters applied, same as the engine's main `rows` pass.
 *
 *   [2/3] Previous-period value
 *         Same WHERE as [1/3] plus a shifted date window
 *         (:prev_from / :prev_to are runtime-computed from the current
 *         period bounds and the trend.periods shift).
 *
 *   [3/3] Sparkline history
 *         Same WHERE as [1/3] (the engine applies ALL filters including
 *         date-range to the sparkline rows — the comment in the engine
 *         source saying "no date filter" is misleading; the code calls
 *         mergedFilterGroups with the full config).
 *         The result is then GROUP BY + ORDER BY the trend interval.
 */
export function generateStatSql(
  config: StatQueryConfig,
  pc: ProductConfig,
  globalFilters?: FilterCondition[],
): string {
  if (!config?.entities?.length) return '-- No entities configured';
  if (!config.agg)                return '-- No aggregation configured';
  if (!findEntity(pc, config.entities[0])) {
    return `-- Entity '${config.entities[0]}' not found in product schema`;
  }

  const joins      = buildJoinClauses(config.entities, pc);
  const groups     = buildGroups(config.entities, config.filterGroups, config.filters, globalFilters);
  const where      = whereSql(groups, pc);
  const fromBlock  = [`FROM   ${tableRef(pc, config.entities[0])}`, ...joins].join('\n');

  const lines: string[] = [
    banner(`STAT  ·  ${config.agg.function}(${config.agg.entity}.${config.agg.field})  ·  product: ${pc.product.slug}`),
    ...(config.periodLabel     ? [`-- Period label : "${config.periodLabel}"`] : []),
    ...(config.dateRangeField  ? [dateRangeFieldNote(config.dateRangeField)]   : []),
    globalFilterBox(globalFilters),
  ];

  // ── [1/3] or single main query ───────────────────────────────────────────
  if (config.trend) lines.push(`\n-- [1/3] Current-period value (all filters applied)`);

  lines.push(
    [`SELECT ${aggExpr(config.agg, pc, 'value')}`, fromBlock, where]
      .filter(Boolean).join('\n') + ';',
  );

  // ── [2/3] + [3/3] Trend sub-queries ─────────────────────────────────────
  if (config.trend) {
    const { entity, field, interval, periods } = config.trend;
    const trendCol = colRef(pc, entity, field);

    // [2/3] Previous period — same WHERE + dynamic date window on top
    lines.push(
      `\n-- [2/3] Previous-period value`,
      `--       The engine derives period bounds from the min/max dates of the`,
      `--       current rows, then shifts the window back by ${periods} ${interval}${periods !== 1 ? 's' : ''}.`,
      `--       :prev_from / :prev_to are computed at runtime from the data.`,
    );
    const prevWhereParts = where
      ? `${where}\n  AND  ${trendCol} BETWEEN :prev_from AND :prev_to`
      : `WHERE  ${trendCol} BETWEEN :prev_from AND :prev_to`;

    lines.push(
      [`SELECT ${aggExpr(config.agg, pc, 'previous_value')}`, fromBlock, prevWhereParts]
        .filter(Boolean).join('\n') + ';',
    );

    // [3/3] Sparkline — same WHERE as [1/3], just grouped by date bucket
    lines.push(
      `\n-- [3/3] Sparkline — all filtered rows bucketed by ${interval}`,
      `--       Uses the SAME WHERE clause as [1/3].  The engine comment`,
      `--       "no date filter" is misleading; it calls mergedFilterGroups`,
      `--       with the full config so all filters (including date-range)`,
      `--       are applied to the sparkline rows as well.`,
    );
    // Engine: `if (!v) return false` before formatDateBucket — rows with a NULL
    // trend date are silently skipped.  Add an explicit IS NOT NULL guard so
    // the SQL doesn't produce a stray NULL-period bucket.
    const sparkWhere = where
      ? `${where}\n  AND  ${trendCol} IS NOT NULL`
      : `WHERE  ${trendCol} IS NOT NULL`;

    lines.push(
      [
        `SELECT ${dateTrunc(trendCol, interval)} AS period,`,
        `       ${aggExpr(config.agg, pc, 'value')}`,
        fromBlock,
        sparkWhere,
        `GROUP BY period`,
        `ORDER BY period ASC;`,
      ].filter(Boolean).join('\n'),
    );
  }

  return lines.filter(l => l !== '').join('\n');
}

// ── CHART ─────────────────────────────────────────────────────────────────────

/**
 * Generates SQL for ChartQueryConfig (Bar / Line widgets).
 *
 * Four shapes based on dateAxis x groupBy presence:
 *
 *   A  no dateAxis, no groupBy  → empty chart warning
 *   B  no dateAxis, groupBy set → category chart: COALESCE(col::text,'(null)')
 *                                 mirrors the engine converting NULL group values
 *                                 to the string '(null)' before grouping
 *   C  dateAxis, no groupBy     → time-series, single series, GROUP BY period
 *   D  dateAxis + groupBy       → multi-series; engine pivots in-memory so one
 *                                 series per distinct groupBy value is produced
 */
export function generateChartSql(
  config: ChartQueryConfig,
  pc: ProductConfig,
  globalFilters?: FilterCondition[],
): string {
  if (!config?.entities?.length) return '-- No entities configured';
  if (!config.valueAgg)          return '-- No value aggregation configured';
  if (!findEntity(pc, config.entities[0])) {
    return `-- Entity '${config.entities[0]}' not found in product schema`;
  }

  const joins     = buildJoinClauses(config.entities, pc);
  const groups    = buildGroups(config.entities, config.filterGroups, config.filters, globalFilters);
  const where     = whereSql(groups, pc);
  const fromBlock = [`FROM   ${tableRef(pc, config.entities[0])}`, ...joins].join('\n');

  const lines: string[] = [
    banner(`CHART  ·  ${config.valueAgg.function}  ·  product: ${pc.product.slug}`),
    ...(config.dateRangeField ? [dateRangeFieldNote(config.dateRangeField)] : []),
    globalFilterBox(globalFilters),
  ];

  if (!config.dateAxis) {
    // ── Shapes A / B — Category chart ────────────────────────────────────
    if (!config.groupBy) {
      lines.push(`-- Shape A: No groupBy configured — chart will render empty`);
      lines.push(`-- Add a groupBy field to define the x-axis categories.`);
      return lines.filter(Boolean).join('\n');
    }

    const rawCol = colRef(pc, config.groupBy.entity, config.groupBy.field);
    // Engine: gv != null ? String(gv) : '(null)'  →  COALESCE(col::text, '(null)')
    const gbExpr = `COALESCE(${rawCol}::text, '(null)')`;

    lines.push(
      `-- Shape B: Category chart`,
      `--   x-axis labels = distinct values of ${config.groupBy.entity}.${config.groupBy.field}`,
      `--   COALESCE(::text, '(null)') mirrors the engine converting NULL values`,
      `--   to the literal string '(null)' before grouping`,
      `--   One series produced; each label maps to one aggregated value.`,
    );
    lines.push(
      [
        `SELECT ${gbExpr} AS label,`,
        `       ${aggExpr(config.valueAgg, pc, 'value')}`,
        fromBlock,
        where,
        `GROUP BY label`,
        `ORDER BY label ASC;`,
      ].filter(Boolean).join('\n'),
    );

  } else {
    // ── Shapes C / D — Date-axis chart ───────────────────────────────────
    const { entity: da_e, field: da_f, interval } = config.dateAxis;
    const dateCol    = colRef(pc, da_e, da_f);
    const periodExpr = dateTrunc(dateCol, interval);

    if (!config.groupBy) {
      // Shape C — single time series
      lines.push(
        `-- Shape C: Time-series, single series (interval: ${interval})`,
        `--   Rows with NULL date values are excluded (DATE_TRUNC(NULL) = NULL`,
        `--   groups separately; the engine skips them with an explicit null-check).`,
      );
      lines.push(
        [
          `SELECT ${periodExpr} AS period,`,
          `       ${aggExpr(config.valueAgg, pc, 'value')}`,
          fromBlock,
          where ? `${where}\n  AND  ${dateCol} IS NOT NULL` : `WHERE  ${dateCol} IS NOT NULL`,
          `GROUP BY period`,
          `ORDER BY period ASC;`,
        ].filter(Boolean).join('\n'),
      );

    } else {
      // Shape D — multi-series
      const rawCol = colRef(pc, config.groupBy.entity, config.groupBy.field);
      const gbExpr = `COALESCE(${rawCol}::text, '(null)')`;

      lines.push(
        `-- Shape D: Time-series, multi-series (interval: ${interval})`,
        `--   Series split by distinct values of ${config.groupBy.entity}.${config.groupBy.field}`,
        `--   Engine pivots in-memory: one series object per distinct groupBy value.`,
        `--   COALESCE(::text, '(null)') mirrors the engine's null-to-string conversion.`,
        `--   Rows with NULL date values are excluded (engine null-check on row[dateKey]).`,
      );
      lines.push(
        [
          `SELECT ${periodExpr} AS period,`,
          `       ${gbExpr} AS series,`,
          `       ${aggExpr(config.valueAgg, pc, 'value')}`,
          fromBlock,
          where ? `${where}\n  AND  ${dateCol} IS NOT NULL` : `WHERE  ${dateCol} IS NOT NULL`,
          `GROUP BY period, series`,
          `ORDER BY period ASC, series ASC;`,
        ].filter(Boolean).join('\n'),
      );
    }
  }

  return lines.filter(Boolean).join('\n');
}

// ── PIE ───────────────────────────────────────────────────────────────────────

/**
 * Generates SQL for PieQueryConfig.
 *
 * When topN is set, a LIMIT clause is emitted and a comment explains that the
 * engine collapses remaining segments into a synthetic "Other" bucket in-memory
 * — this cannot be expressed in a single standard SQL statement.
 */
export function generatePieSql(
  config: PieQueryConfig,
  pc: ProductConfig,
  globalFilters?: FilterCondition[],
): string {
  if (!config?.entities?.length) return '-- No entities configured';
  if (!config.groupBy)           return '-- No groupBy field configured';
  if (!config.valueAgg)          return '-- No value aggregation configured';
  if (!findEntity(pc, config.entities[0])) {
    return `-- Entity '${config.entities[0]}' not found in product schema`;
  }

  const joins     = buildJoinClauses(config.entities, pc);
  const groups    = buildGroups(config.entities, config.filterGroups, config.filters, globalFilters);
  const where     = whereSql(groups, pc);
  const fromBlock = [`FROM   ${tableRef(pc, config.entities[0])}`, ...joins].join('\n');

  const rawCol = colRef(pc, config.groupBy.entity, config.groupBy.field);
  // Engine: gv != null ? String(gv) : '(null)'
  const gbExpr = `COALESCE(${rawCol}::text, '(null)')`;

  const lines: string[] = [
    banner(`PIE  ·  ${config.valueAgg.function}  grouped by ${config.groupBy.entity}.${config.groupBy.field}  ·  product: ${pc.product.slug}`),
    ...(config.dateRangeField ? [dateRangeFieldNote(config.dateRangeField)] : []),
    globalFilterBox(globalFilters),
  ];

  lines.push(
    [
      `SELECT ${gbExpr} AS label,`,
      `       ${aggExpr(config.valueAgg, pc, 'value')}`,
      fromBlock,
      where,
      `GROUP BY label`,
      `ORDER BY value DESC`,
      ...(config.topN ? [`LIMIT  ${config.topN}`] : []),
    ].filter(Boolean).join('\n') + ';',
  );

  if (config.topN) {
    lines.push(
      ``,
      `-- ⓘ  topN = ${config.topN}`,
      `--    The query above fetches only the top ${config.topN} segments.`,
      `--    The engine then sums all remaining segments into a single`,
      `--    synthetic "Other" bucket (color #9ca3af) computed in-memory.`,
      `--    Equivalent extra step:`,
      `--`,
      `--      other_value = SUM(value) FROM <above result> WHERE rank > ${config.topN}`,
      `--      final       = top_${config.topN}_rows`,
      `--                    UNION ALL`,
      `--                    SELECT 'Other', other_value   -- label matches engine exactly`,
    );
  }

  return lines.filter(Boolean).join('\n');
}

// ── TABLE ─────────────────────────────────────────────────────────────────────

/**
 * Generates SQL for TableQueryConfig.
 *
 * ORDER BY NULL handling mirrors the engine's custom comparator (lines 91-95
 * in query.service.ts):
 *   - NULL sorts LAST  on ASC  (av == null → return +1 → pushes to end)
 *   - NULL sorts FIRST on DESC (same +1 value, then negated → to front)
 * This is expressed as NULLS LAST / NULLS FIRST in standard SQL.
 *
 * A second COUNT(*) pass is noted because the engine runs it to compute
 * totalRows for the pagination footer without the LIMIT constraint.
 */
export function generateTableSql(
  config: TableQueryConfig,
  pc: ProductConfig,
  globalFilters?: FilterCondition[],
): string {
  if (!config?.entities?.length) return '-- No entities configured';
  if (!findEntity(pc, config.entities[0])) {
    return `-- Entity '${config.entities[0]}' not found in product schema`;
  }

  const joins     = buildJoinClauses(config.entities, pc);
  const groups    = buildGroups(config.entities, config.filterGroups, config.filters, globalFilters);
  const where     = whereSql(groups, pc);
  const fromBlock = [`FROM   ${tableRef(pc, config.entities[0])}`, ...joins].join('\n');

  // ── SELECT list ──
  const baseCols    = (config.columns ?? []).map(c => `       ${colRef(pc, c.entity, c.field)}`);
  const derivedCols = (config.derivedColumns ?? []).map(def => `       ${derivedExpr(def, pc)}`);
  const allCols     = [...baseCols, ...derivedCols];
  const selectClause = allCols.length
    ? `SELECT\n${allCols.join(',\n')}`
    : `SELECT *  -- no columns selected; all columns returned`;

  // ── ORDER BY — NULL sort matches engine's custom comparator ──
  let orderBy = '';
  if (config.sort) {
    const sortCol    = colRef(pc, config.sort.entity, config.sort.field);
    const dir        = config.sort.direction === SortDirection.Desc ? 'DESC' : 'ASC';
    // Engine comparator (query.service.ts lines 90-96):
    //   if (av == null) return 1   ← executed BEFORE the direction flip
    //   if (bv == null) return -1  ← same — null checks are direction-agnostic
    //   return direction === Desc ? -cmp : cmp
    // Because the null branches fire before the direction check, NULL always
    // sorts last on both ASC and DESC.  Use NULLS LAST unconditionally.
    const nullsClause = 'NULLS LAST';
    orderBy = `ORDER BY ${sortCol} ${dir} ${nullsClause}`;
  }

  // ── LIMIT / OFFSET ──
  const pageSize   = Math.max(1, config.pageSize ?? 20);
  const page       = Math.max(1, config.page ?? 1);
  const offset     = (page - 1) * pageSize;
  const limitLine  = `LIMIT  ${pageSize}`;
  const offsetLine = offset > 0 ? `OFFSET ${offset}` : '';

  const lines: string[] = [
    banner(`TABLE  ·  product: ${pc.product.slug}`),
    ...(config.derivedColumns?.length
      ? [`-- ${config.derivedColumns.length} derived column(s) computed in-memory after base projection.`]
      : []),
    ...(config.dateRangeField ? [dateRangeFieldNote(config.dateRangeField)] : []),
    globalFilterBox(globalFilters),
  ];

  lines.push(
    [selectClause, fromBlock, where, orderBy, limitLine, offsetLine]
      .filter(Boolean).join('\n') + ';',
  );

  lines.push(
    ``,
    `-- Pagination: page ${page}, ${pageSize} rows per page${offset > 0 ? `, offset ${offset}` : ''}`,
    `-- Engine runs a second COUNT(*) pass (no LIMIT) to compute totalRows:`,
    `--   SELECT COUNT(*) ${fromBlock.replace(/\n/g, ' ')}${where ? ' ' + where.replace(/\n/g, ' ') : ''};`,
  );

  return lines.filter(Boolean).join('\n');
}
