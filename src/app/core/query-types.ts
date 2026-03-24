// ── Enums ────────────────────────────────────────────────────────────────────

export enum AggregationFunction {
  Count         = 'COUNT',
  CountDistinct = 'COUNT_DISTINCT',
  Sum           = 'SUM',
  Avg           = 'AVG',
  Min           = 'MIN',
  Max           = 'MAX',
}

export enum FilterOperator {
  Eq        = 'eq',
  Neq       = 'neq',
  In        = 'in',
  NotIn     = 'not_in',
  Gt        = 'gt',
  Gte       = 'gte',
  Lt        = 'lt',
  Lte       = 'lte',
  IsNull    = 'is_null',
  IsNotNull = 'is_not_null',
  DateRange = 'date_range',
  Contains  = 'contains',
}

export enum DateInterval {
  Day     = 'day',
  Week    = 'week',
  Month   = 'month',
  Quarter = 'quarter',
  Year    = 'year',
}

export enum DateRangePreset {
  Today      = 'today',
  Yesterday  = 'yesterday',
  Last7Days  = 'last_7_days',
  Last30Days = 'last_30_days',
  Last90Days = 'last_90_days',
  ThisMonth  = 'this_month',
  LastMonth  = 'last_month',
  ThisYear   = 'this_year',
  LastYear   = 'last_year',
}

export enum QueryWarningCode {
  LeftJoinNull          = 'LEFT_JOIN_NULL',
  FanOutRisk            = 'FAN_OUT_RISK',
  HighCardinality       = 'HIGH_CARDINALITY',
  FilterOnNonFilterable = 'FILTER_ON_NON_FILTERABLE',
  EntityNotReachable    = 'ENTITY_NOT_REACHABLE',
  AvgIncludesNulls      = 'AVG_INCLUDES_NULLS',
}

export enum JoinType {
  Inner = 'INNER',
  Left  = 'LEFT',
}

export enum FieldType {
  String   = 'string',
  Number   = 'number',
  Boolean  = 'boolean',
  Datetime = 'datetime',
}

export enum GlobalFilterType {
  Site = 'site',
  Date = 'date',
}

export enum SortDirection {
  Asc  = 'asc',
  Desc = 'desc',
}

export type FilterLogic = 'AND' | 'OR';

// ── Product Config types (mirrors the JSON config schema) ──────────────────

export interface ProductConfig {
  product: { slug: string; display_name: string; version: string };
  connection: { type: string; host: string; database: string; username: string; password: string };
  global_filter_dimensions: GlobalFilterDimension[];
  joins: JoinDef[];
  entities: EntityDef[];
}

export interface GlobalFilterDimension {
  type: GlobalFilterType;
  entity: string;
  field: string;
  label: string;
}

export interface JoinDef {
  name: string;
  from: { entity: string; column: string };
  to: { entity: string; column: string };
  type: JoinType;
}

export interface EntityDef {
  name: string;
  schema: string;
  table: string;
  is_view: boolean;
  display_field?: string;
  default_date_field?: string;
  fields: FieldDef[];
}

export interface FieldDef {
  name: string;           // logical name used in queries
  column: string;         // actual DB column name in mock data rows
  type: FieldType;
  filterable: boolean;
  aggregatable: boolean;
  is_primary_key?: boolean;
  description?: string;
  status_values?: StatusValueDef[];
}

export interface StatusValueDef {
  value: string;
  label: string;
  color: string;
}

// ── Mock database structure ─────────────────────────────────────────────────
// schemas[schemaName][tableName] = array of DB rows (keyed by DB column name)

export interface MockDatabase {
  product: string;
  schemas: Record<string, Record<string, Record<string, unknown>[]>>;
}

// ── Query primitives ────────────────────────────────────────────────────────

export interface DateRangeValue {
  preset?: DateRangePreset;
  from?: string;   // ISO date string  (inclusive)
  to?: string;     // ISO date string  (inclusive)
}

export interface FilterCondition {
  entity: string;
  field: string;
  operator: FilterOperator;
  value?: unknown;           // eq, neq, gt, gte, lt, lte, contains
  values?: unknown[];        // in, not_in
  dateRange?: DateRangeValue; // date_range
  /** Human-readable label for this filter — used to auto-populate period labels in stat widgets */
  label?: string;
}

/** A named group of filter conditions combined with a single AND/OR connector.
 *  Multiple groups are always AND-ed together at the top level, giving:
 *  group1(A AND B) AND group2(C OR D) */
export interface FilterGroup {
  id: string;
  logic: FilterLogic;
  conditions: FilterCondition[];
}

export interface AggConfig {
  entity: string;
  field: string;
  function: AggregationFunction;
  alias?: string;
}

// ── Warnings ────────────────────────────────────────────────────────────────

export interface QueryWarning {
  code: QueryWarningCode;
  message: string;
  detail?: string;
}

// ── Result types ─────────────────────────────────────────────────────────────

export interface ResultColumn {
  key: string;              // "entity.fieldName" — use as row key
  label: string;            // human-readable header
  type: FieldType;
  statusValues?: StatusValueDef[];
}

// ── Table query ──────────────────────────────────────────────────────────────

/**
 * A derived (computed) column built from multiple source fields.
 * Evaluated client-side after the base query projection.
 */
export interface DerivedColumnDef {
  /** Synthetic row key — "__derived_<timestamp>" — unique within a widget config. */
  key:        string;
  /** Human-readable column header shown in the table. */
  label?:     string;
  /** How source field values are combined. */
  mode:       'concat' | 'sum' | 'subtract' | 'multiply' | 'divide';
  /** Source fields whose values feed this formula (in order). */
  sources:    Array<{ entity: string; field: string }>;
  /** Separator between values — concat mode only; default ' '. */
  separator?: string;
}

export interface TableQueryConfig {
  product: string;                                    // product slug
  entities: string[];                                 // join order, first = root
  columns: Array<{ entity: string; field: string }>; // base columns to fetch
  /** Derived/computed columns evaluated after base projection. */
  derivedColumns?: DerivedColumnDef[];
  filters?: FilterCondition[];       // legacy flat AND list (backward-compat)
  filterGroups?: FilterGroup[];      // structured AND/OR groups (takes precedence)
  sort?: { entity: string; field: string; direction: SortDirection };
  page?: number;     // 1-based (default 1)
  pageSize?: number; // default 20
  /** When set, renders a per-widget date-range picker linked to this field */
  dateRangeField?: { entity: string; field: string };
}

export interface TableQueryResult {
  columns: ResultColumn[];
  rows: Record<string, unknown>[];
  totalRows: number;
  page: number;
  pageSize: number;
  warnings: QueryWarning[];
}

// ── Stat query ───────────────────────────────────────────────────────────────

export interface StatQueryConfig {
  product: string;
  entities: string[];
  agg: AggConfig;
  filters?: FilterCondition[];       // legacy flat AND list (backward-compat)
  filterGroups?: FilterGroup[];      // structured AND/OR groups (takes precedence)
  /** Human-readable label describing the time period (e.g. "Last 30 days") */
  periodLabel?: string;
  /** When set, renders a per-widget date-range picker linked to this field */
  dateRangeField?: { entity: string; field: string };
  /** Compare current period to previous period of the same length */
  trend?: {
    entity: string;
    field: string;        // date field
    interval: DateInterval;
    periods: number;      // how many periods back (1 = compare to previous period)
  };
}

export interface StatQueryResult {
  value: number;
  formattedValue: string;
  previousValue?: number;
  changePercent?: number;  // positive = increase vs previous period
  trendHistory?: number[]; // per-interval aggregated values for sparkline
  /** Auto-computed from active date filters (global or query-level) */
  computedPeriodLabel?: string;
  warnings: QueryWarning[];
}

// ── Chart query (bar / line) ─────────────────────────────────────────────────

export interface ChartQueryConfig {
  product: string;
  entities: string[];
  /** Time-based x-axis (bar/line by date). Omit for category charts. */
  dateAxis?: { entity: string; field: string; interval: DateInterval };
  valueAgg: AggConfig;
  /** Category grouping. When dateAxis is absent, used as x-axis labels.
   *  When dateAxis is present, splits into multiple series. */
  groupBy?: { entity: string; field: string };
  filters?: FilterCondition[];       // legacy flat AND list (backward-compat)
  filterGroups?: FilterGroup[];      // structured AND/OR groups (takes precedence)
  /** When set, renders a per-widget date-range picker linked to this field */
  dateRangeField?: { entity: string; field: string };
}

export interface ChartQueryResult {
  labels: string[];
  series: Array<{ name: string; data: number[] }>;
  warnings: QueryWarning[];
}

// ── Pie query ────────────────────────────────────────────────────────────────

export interface PieQueryConfig {
  product: string;
  entities: string[];
  groupBy: { entity: string; field: string };
  valueAgg: AggConfig;
  filters?: FilterCondition[];       // legacy flat AND list (backward-compat)
  filterGroups?: FilterGroup[];      // structured AND/OR groups (takes precedence)
  topN?: number;  // if set, groups beyond topN are collapsed into "Other"
  /** When set, renders a per-widget date-range picker linked to this field */
  dateRangeField?: { entity: string; field: string };
}

export interface PieQueryResult {
  segments: Array<{ label: string; value: number; color?: string }>;
  warnings: QueryWarning[];
}
