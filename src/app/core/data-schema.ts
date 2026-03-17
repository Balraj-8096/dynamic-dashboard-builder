// ═══════════════════════════════════════════════════════════════
//  DASHCRAFT — DATA_SCHEMA, FIELD_POOL_MAP, buildConfigFromFields
//
//  Used by:
//  ├── Add Widget Wizard Step 2 — field selection
//  ├── Edit Modal Fields tab — field selection
//  ├── buildConfigFromFields() — converts selected IDs → config
//  └── FIELD_POOL_MAP — tells wizard which pool each type uses
//
//  Direct port from React DATA_SCHEMA and FIELD_POOL_MAP
// ═══════════════════════════════════════════════════════════════

import {
  DataSchema,
  FieldPoolEntry,
  WidgetType,
  WidgetConfig,
  StatConfig,
  AnalyticsConfig,
  BarConfig,
  LineConfig,
  PieConfig,
  TableConfig,
  ProgressConfig,
} from './interfaces';


// ───────────────────────────────────────────────────────────────
//  DATA SCHEMA
//  Master pool of all pre-built fields
// ───────────────────────────────────────────────────────────────

export const DATA_SCHEMA: DataSchema = {

  // ── KPI Fields (used by stat + analytics) ───────────────────
  kpi: [
    {
      id:       'revenue',
      label:    'Total Revenue',
      value:    '$124,580',
      trend:    '+18.4%',
      trendUp:  true,
      accent:   '#3b82f6',
      spark:    [30, 42, 38, 55, 48, 64, 58, 72, 68, 84],
      category: 'Finance',
    },
    {
      id:       'users',
      label:    'Active Users',
      value:    '8,291',
      trend:    '+5.2%',
      trendUp:  true,
      accent:   '#22c55e',
      spark:    [20, 32, 28, 42, 38, 51, 45, 60, 54, 68],
      category: 'Audience',
    },
    {
      id:       'conversion',
      label:    'Conversion Rate',
      value:    '3.84%',
      trend:    '-0.3%',
      trendUp:  false,
      accent:   '#f59e0b',
      spark:    [4.2, 3.8, 4.5, 3.2, 3.6, 4.1, 3.9, 3.5, 4.0, 3.8],
      category: 'Marketing',
    },
    {
      id:       'orders',
      label:    'Total Orders',
      value:    '2,847',
      trend:    '+12.1%',
      trendUp:  true,
      accent:   '#a78bfa',
      spark:    [180, 220, 195, 240, 210, 260, 230, 270, 245, 280],
      category: 'Sales',
    },
    {
      id:       'aov',
      label:    'Avg. Order Value',
      value:    '$127.40',
      trend:    '+8.1%',
      trendUp:  true,
      accent:   '#06b6d4',
      spark:    [110, 95, 130, 118, 142, 125, 138, 120, 145, 127],
      category: 'Finance',
    },
    {
      id:       'bounce',
      label:    'Bounce Rate',
      value:    '38.4%',
      trend:    '-2.1%',
      trendUp:  false,
      accent:   '#f97316',
      spark:    [42, 38, 45, 36, 40, 37, 39, 35, 41, 38, 36, 38],
      category: 'Marketing',
    },
    {
      id:       'sessions',
      label:    'Sessions',
      value:    '54,219',
      trend:    '+9.3%',
      trendUp:  true,
      accent:   '#ec4899',
      spark:    [35, 42, 38, 48, 44, 52, 46, 55, 50, 60],
      category: 'Audience',
    },
    {
      id:       'churn',
      label:    'Churn Rate',
      value:    '2.1%',
      trend:    '+0.4%',
      trendUp:  false,
      accent:   '#ef4444',
      spark:    [1.8, 2.0, 1.9, 2.2, 2.0, 2.3, 2.1, 2.4, 2.2, 2.1],
      category: 'Retention',
    },
    {
      id:       'mrr',
      label:    'MRR',
      value:    '$48,290',
      trend:    '+22.1%',
      trendUp:  true,
      accent:   '#10b981',
      spark:    [28, 35, 32, 42, 38, 48, 44, 52, 48, 58],
      category: 'Finance',
    },
    {
      id:       'nps',
      label:    'NPS Score',
      value:    '72',
      trend:    '+4 pts',
      trendUp:  true,
      accent:   '#8b5cf6',
      spark:    [62, 65, 68, 64, 70, 68, 72, 70, 74, 72],
      category: 'Customer',
    },
    {
      id:       'csat',
      label:    'CSAT',
      value:    '94.2%',
      trend:    '+1.8%',
      trendUp:  true,
      accent:   '#14b8a6',
      spark:    [91, 92, 90, 93, 92, 94, 93, 95, 94, 94],
      category: 'Customer',
    },
    {
      id:       'ltv',
      label:    'Avg. LTV',
      value:    '$1,240',
      trend:    '+6.5%',
      trendUp:  true,
      accent:   '#f59e0b',
      spark:    [980, 1020, 1050, 1080, 1100, 1130, 1160, 1180, 1200, 1240],
      category: 'Finance',
    },
  ],

  // ── Time-Series Fields (used by bar + line) ──────────────────
  series: [
    {
      id:    'revenue_ts',
      label: 'Revenue',
      color: '#3b82f6',
      data: [
        { n: 'Jan', v: 42000 }, { n: 'Feb', v: 38000 },
        { n: 'Mar', v: 61000 }, { n: 'Apr', v: 79000 },
        { n: 'May', v: 53000 }, { n: 'Jun', v: 92000 },
      ],
    },
    {
      id:    'expenses_ts',
      label: 'Expenses',
      color: '#ef4444',
      data: [
        { n: 'Jan', v: 28000 }, { n: 'Feb', v: 24000 },
        { n: 'Mar', v: 35000 }, { n: 'Apr', v: 41000 },
        { n: 'May', v: 29000 }, { n: 'Jun', v: 48000 },
      ],
    },
    {
      id:    'profit_ts',
      label: 'Profit',
      color: '#22c55e',
      data: [
        { n: 'Jan', v: 14000 }, { n: 'Feb', v: 14000 },
        { n: 'Mar', v: 26000 }, { n: 'Apr', v: 38000 },
        { n: 'May', v: 24000 }, { n: 'Jun', v: 44000 },
      ],
    },
    {
      id:    'visitors_ts',
      label: 'Visitors',
      color: '#06b6d4',
      data: [
        { n: 'Mon', v: 2100 }, { n: 'Tue', v: 4800 },
        { n: 'Wed', v: 3300 }, { n: 'Thu', v: 7400 },
        { n: 'Fri', v: 5200 }, { n: 'Sat', v: 8500 },
        { n: 'Sun', v: 6900 },
      ],
    },
    {
      id:    'conv_ts',
      label: 'Conversions',
      color: '#22c55e',
      data: [
        { n: 'Mon', v:  840 }, { n: 'Tue', v: 1920 },
        { n: 'Wed', v: 1320 }, { n: 'Thu', v: 2960 },
        { n: 'Fri', v: 2080 }, { n: 'Sat', v: 3400 },
        { n: 'Sun', v: 2760 },
      ],
    },
    {
      id:    'orders_ts',
      label: 'Orders',
      color: '#a78bfa',
      data: [
        { n: 'Mon', v:  320 }, { n: 'Tue', v: 680 },
        { n: 'Wed', v:  510 }, { n: 'Thu', v: 890 },
        { n: 'Fri', v:  740 }, { n: 'Sat', v: 1020 },
        { n: 'Sun', v:  860 },
      ],
    },
    {
      id:    'signups_ts',
      label: 'New Signups',
      color: '#f97316',
      data: [
        { n: 'Q1', v: 1240 }, { n: 'Q2', v: 1580 },
        { n: 'Q3', v: 1390 }, { n: 'Q4', v: 1820 },
      ],
    },
    {
      id:    'churn_ts',
      label: 'Churn',
      color: '#ef4444',
      data: [
        { n: 'Q1', v: 180 }, { n: 'Q2', v: 210 },
        { n: 'Q3', v: 165 }, { n: 'Q4', v: 190 },
      ],
    },
  ],

  // ── Segment Fields (used by pie / donut) ─────────────────────
  segments: [
    { id: 'organic',  name: 'Organic Search', value: 4200, color: '#3b82f6' },
    { id: 'direct',   name: 'Direct',         value: 3100, color: '#22c55e' },
    { id: 'referral', name: 'Referral',        value: 1800, color: '#f59e0b' },
    { id: 'social',   name: 'Social Media',    value: 1200, color: '#a78bfa' },
    { id: 'email',    name: 'Email',           value:  900, color: '#f97316' },
    { id: 'paid',     name: 'Paid Search',     value: 2400, color: '#06b6d4' },
    { id: 'display',  name: 'Display Ads',     value:  800, color: '#ec4899' },
  ],

  // ── Column Fields (used by table) ────────────────────────────
  columns: [
    { id: 'col_id',       key: 'id',       label: 'Order ID'  },
    { id: 'col_customer', key: 'customer', label: 'Customer'  },
    { id: 'col_product',  key: 'product',  label: 'Product'   },
    { id: 'col_amount',   key: 'amount',   label: 'Amount'    },
    { id: 'col_date',     key: 'date',     label: 'Date'      },
    { id: 'col_status',   key: 'status',   label: 'Status'    },
    { id: 'col_email',    key: 'email',    label: 'Email'     },
    { id: 'col_region',   key: 'region',   label: 'Region'    },
    { id: 'col_channel',  key: 'channel',  label: 'Channel'   },
  ],

  // ── Progress Item Fields (used by progress) ──────────────────
  items: [
    { id: 'item_sales',     label: 'Sales Target',    value: 78, max: 100, color: '#3b82f6' },
    { id: 'item_customers', label: 'New Customers',   value: 56, max: 100, color: '#22c55e' },
    { id: 'item_support',   label: 'Support Tickets', value: 91, max: 100, color: '#f59e0b' },
    { id: 'item_nps',       label: 'NPS Score',       value: 64, max: 100, color: '#a78bfa' },
    { id: 'item_uptime',    label: 'Uptime',          value: 99, max: 100, color: '#06b6d4' },
    { id: 'item_csat',      label: 'CSAT',            value: 94, max: 100, color: '#10b981' },
    { id: 'item_retention', label: 'Retention Rate',  value: 87, max: 100, color: '#f97316' },
  ],

};


// ───────────────────────────────────────────────────────────────
//  FIELD POOL MAP
//  Maps each widget type → which pool it uses in DATA_SCHEMA
// ───────────────────────────────────────────────────────────────

/**
 * Tells the wizard and edit modal:
 * - Which data pool to show for each widget type
 * - Whether multiple fields can be selected (multi: true)
 * - A hint string shown above the field selector
 * - null means no field selection step (Note, Section)
 */
export const FIELD_POOL_MAP: Partial<Record<WidgetType, FieldPoolEntry | null>> = {
  [WidgetType.Stat]: {
    pool:  'kpi',
    multi: true,
    hint:  'Select one or more KPI metrics to display',
  },
  [WidgetType.Analytics]: {
    pool:  'kpi',
    multi: false,
    hint:  'Select a single metric to track',
  },
  [WidgetType.Bar]: {
    pool:  'series',
    multi: true,
    hint:  'Select one or more data series to chart',
  },
  [WidgetType.Line]: {
    pool:  'series',
    multi: true,
    hint:  'Select one or more data series to chart',
  },
  [WidgetType.Pie]: {
    pool:  'segments',
    multi: true,
    hint:  'Select segments to include in the chart',
  },
  [WidgetType.Table]: {
    pool:  'columns',
    multi: true,
    hint:  'Select columns to display in the table',
  },
  [WidgetType.Progress]: {
    pool:  'items',
    multi: true,
    hint:  'Select metrics to show as progress bars',
  },
  // Note and Section have no field selection step
  [WidgetType.Note]:    null,
  [WidgetType.Section]: null,
};


// ───────────────────────────────────────────────────────────────
//  BUILD CONFIG FROM FIELDS
//  Converts selected field IDs → actual widget config values
// ───────────────────────────────────────────────────────────────

/**
 * Converts selected DATA_SCHEMA field IDs into a widget config.
 * Called by the wizard on Step 3 and by the Edit Modal on save.
 *
 * Rules per type:
 * - stat      → first field sets value/trend/accent/sparkData
 *               multiple fields → multi-tile mode via selectedFields
 * - analytics → single field sets value/changeValue/data/accent
 * - bar/line  → selected series IDs map to series[] array
 * - pie       → selected segment IDs map to data[] array
 * - table     → selected column IDs filter the columns[] array
 * - progress  → selected item IDs filter the items[] array
 * - note/section → no field pool, returns existing config unchanged
 *
 * @param type           - Widget type
 * @param selectedIds    - Array of selected field IDs
 * @param existingConfig - Current widget config (used as base)
 * @returns              - Updated widget config
 */
export function buildConfigFromFields(
  type:           WidgetType,
  selectedIds:    string[],
  existingConfig: WidgetConfig
): WidgetConfig {

  // No field pool for note and section — return unchanged
  if (type === WidgetType.Note || type === WidgetType.Section) {
    return existingConfig;
  }

  // Nothing selected — return existing config unchanged
  if (!selectedIds.length) {
    return existingConfig;
  }

  switch (type) {

    // ── Stat ────────────────────────────────────────────────
    // B3 fix: was missing subValue (field.category) and
    // description (field.label) — both visible in the stat card UI
    case WidgetType.Stat: {
      const fields = selectedIds
        .map(id => DATA_SCHEMA.kpi.find(f => f.id === id))
        .filter(Boolean) as typeof DATA_SCHEMA.kpi;

      if (!fields.length) return existingConfig;

      const first = fields[0];
      const base  = existingConfig as StatConfig;

      return {
        ...base,
        value:          first.value,
        subValue:       first.category,   // B3 fix: category label below metric name
        trend:          first.trend,
        trendUp:        first.trendUp,
        accent:         first.accent,
        sparkData:      first.spark,
        description:    first.label,      // B3 fix: full field label shown as description
        selectedFields: selectedIds,
      } satisfies StatConfig;
    }

    // ── Analytics ───────────────────────────────────────────
    // B2 fix: was missing changeLabel (field.category)
    // B9 fix: was missing selectedFields — edit modal radio
    //         couldn't determine which KPI was selected
    case WidgetType.Analytics: {
      const field = DATA_SCHEMA.kpi.find(f => f.id === selectedIds[0]);
      if (!field) return existingConfig;

      const base = existingConfig as AnalyticsConfig;

      return {
        ...base,
        value:          field.value,
        changeValue:    field.trend,
        changeLabel:    field.category,   // B2 fix: e.g. "Finance", "Audience"
        trendUp:        field.trendUp,
        accent:         field.accent,
        data:           field.spark,
        selectedFields: selectedIds,      // B9 fix: persists selection for re-edit
      } satisfies AnalyticsConfig;
    }

    // ── Bar ─────────────────────────────────────────────────
    // B6 fix: was missing selectedFields — edit modal checkboxes
    //         had no way to know which series were selected
    case WidgetType.Bar: {
      const series = selectedIds
        .map(id => DATA_SCHEMA.series.find(s => s.id === id))
        .filter(Boolean) as typeof DATA_SCHEMA.series;

      if (!series.length) return existingConfig;

      const base = existingConfig as BarConfig;

      return {
        ...base,
        series: series.map(s => ({
          key:   s.label,
          color: s.color,
          data:  s.data,
        })),
        selectedFields: selectedIds,      // B6 fix
      } satisfies BarConfig;
    }

    // ── Line ────────────────────────────────────────────────
    // B6 fix: same as bar — selectedFields needed for re-edit
    case WidgetType.Line: {
      const series = selectedIds
        .map(id => DATA_SCHEMA.series.find(s => s.id === id))
        .filter(Boolean) as typeof DATA_SCHEMA.series;

      if (!series.length) return existingConfig;

      const base = existingConfig as LineConfig;

      return {
        ...base,
        series: series.map(s => ({
          key:   s.label,
          color: s.color,
          data:  s.data,
        })),
        selectedFields: selectedIds,      // B6 fix
      } satisfies LineConfig;
    }

    // ── Pie ─────────────────────────────────────────────────
    // B6 fix: selectedFields needed for edit modal re-selection
    case WidgetType.Pie: {
      const segments = selectedIds
        .map(id => DATA_SCHEMA.segments.find(s => s.id === id))
        .filter(Boolean) as typeof DATA_SCHEMA.segments;

      if (!segments.length) return existingConfig;

      const base = existingConfig as PieConfig;

      return {
        ...base,
        data: segments.map(s => ({
          name:  s.name,
          value: s.value,
          color: s.color,
        })),
        selectedFields: selectedIds,      // B6 fix
      } satisfies PieConfig;
    }

    // ── Table ───────────────────────────────────────────────
    // B4 fix: was only updating columns — rows must be rebuilt
    //         to add missing keys (blank) and preserve existing
    //         data for keys that remain. Without this, MatTable
    //         renders blank cells for new columns.
    // B6 fix: selectedFields needed for edit modal re-selection
    case WidgetType.Table: {
      const cols = selectedIds
        .map(id => DATA_SCHEMA.columns.find(c => c.id === id))
        .filter(Boolean) as typeof DATA_SCHEMA.columns;

      if (!cols.length) return existingConfig;

      const base = existingConfig as TableConfig;

      // B4 fix: rebuild rows to match new column set
      // — preserve existing values for keys that remain
      // — add empty string for any newly-added column key
      const visibleCols = cols.map(c => ({
        key:   c.key,
        label: c.label,
        width: 'auto' as const,
      }));

      const updatedRows = (base.rows ?? []).map(row => {
        const newRow: Record<string, unknown> = {};
        visibleCols.forEach(col => {
          // Keep existing value if present, otherwise blank
          newRow[col.key] = col.key in row ? row[col.key] : '';
        });
        return newRow;
      });

      return {
        ...base,
        columns:        visibleCols,
        rows:           updatedRows,      // B4 fix: rebuilt rows
        selectedFields: selectedIds,      // B6 fix
      } satisfies TableConfig;
    }

    // ── Progress ────────────────────────────────────────────
    // B6 fix: selectedFields needed for edit modal re-selection
    case WidgetType.Progress: {
      const items = selectedIds
        .map(id => DATA_SCHEMA.items.find(i => i.id === id))
        .filter(Boolean) as typeof DATA_SCHEMA.items;

      if (!items.length) return existingConfig;

      const base = existingConfig as ProgressConfig;

      return {
        ...base,
        items: items.map(i => ({
          label: i.label,
          value: i.value,
          max:   i.max,
          color: i.color,
        })),
        selectedFields: selectedIds,      // B6 fix
      } satisfies ProgressConfig;
    }

    default:
      return existingConfig;
  }
}


// ───────────────────────────────────────────────────────────────
//  SCHEMA HELPER FUNCTIONS
// ───────────────────────────────────────────────────────────────

/**
 * Get the field pool entries for a given widget type
 * Returns null for note and section (no field selection)
 *
 * @example
 * getFieldPool('bar')
 * // → SeriesField[] from DATA_SCHEMA.series
 */
export function getFieldPool(type: WidgetType): any[] | null {
  const entry = FIELD_POOL_MAP[type];
  if (!entry) return null;
  return DATA_SCHEMA[entry.pool] as any[];
}

/**
 * Check if a widget type has a field selection step
 * Used by wizard to determine step count (2 or 3 steps)
 *
 * Edge case from audit: Note and Section = 2 steps, not 3
 *
 * @example
 * hasFieldPool('bar')     // true
 * hasFieldPool('note')    // false
 * hasFieldPool('section') // false
 */
export function hasFieldPool(type: WidgetType): boolean {
  return FIELD_POOL_MAP[type] !== null &&
         FIELD_POOL_MAP[type] !== undefined;
}

/**
 * Check if a widget type supports multi-select in field pool
 * analytics = single select (radio buttons)
 * all others = multi select (checkboxes)
 *
 * @example
 * isMultiSelect('stat')      // true
 * isMultiSelect('analytics') // false
 */
export function isMultiSelect(type: WidgetType): boolean {
  return FIELD_POOL_MAP[type]?.multi ?? false;
}