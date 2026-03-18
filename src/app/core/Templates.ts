// ═══════════════════════════════════════════════════════════════
//  DASHCRAFT — Dashboard Templates
//
//  All templates are EPX-product templates defined in
//  ProductTemplates.ts and re-exported here.
//
//  Loading a template:
//  ├── Replaces widgets[] entirely
//  ├── RESETS history stack to [templateWidgets]
//  ├── NOT undoable back to before template load (C3 audit)
//  └── Sets dashTitle to template name
// ═══════════════════════════════════════════════════════════════

import { Widget, WidgetType } from './interfaces';
import { FACTORIES }          from './factories';
export { PRODUCT_TEMPLATES as TEMPLATES } from './ProductTemplates';


// ───────────────────────────────────────────────────────────────
//  DEMO LAYOUT
//  B5 fix: was incorrectly returning buildSales().
//  The demo is a DISTINCT layout from the Sales template:
//  - Uses analytics cards (not just stat cards) in row 2
//  - Includes a note widget in row 8
//  - Showcases the breadth of widget types as a builder intro
//  Direct port from React loadDemo() inline definition.
// ───────────────────────────────────────────────────────────────

export function buildSalesDemo(): Widget[] {
  return [
    // Row 0 — 4 stat cards (custom configs)
    FACTORIES[WidgetType.Stat](0, 0),
    {
      ...FACTORIES[WidgetType.Stat](3, 0),
      title:  'Active Users',
      config: {
        value: '8,291', subValue: 'Daily active',
        trend: '+5.2%', trendUp: true, accent: '#22c55e',
        prefix: '', suffix: '', description: 'Users active in last 24h',
        showSparkline: true,
        sparkData: [20, 32, 28, 42, 38, 51, 45, 60, 54, 68],
        selectedFields: [],
      },
    },
    {
      ...FACTORIES[WidgetType.Stat](6, 0),
      title:  'Conversion Rate',
      config: {
        value: '3.84', subValue: 'Checkout rate',
        trend: '-0.3%', trendUp: false, accent: '#f59e0b',
        prefix: '', suffix: '%', description: 'Visitors who completed purchase',
        showSparkline: true,
        sparkData: [4.2, 3.8, 4.5, 3.2, 3.6, 4.1, 3.9, 3.5, 4.0, 3.8],
        selectedFields: [],
      },
    },
    {
      ...FACTORIES[WidgetType.Stat](9, 0),
      title:  'Avg. Order Value',
      config: {
        value: '127.40', subValue: 'Per transaction',
        trend: '+8.1%', trendUp: true, accent: '#a78bfa',
        prefix: '$', suffix: '', description: 'Mean value of completed orders',
        showSparkline: true,
        sparkData: [110, 95, 130, 118, 142, 125, 138, 120, 145, 127],
        selectedFields: [],
      },
    },

    // Row 2 — line chart + 2 analytics cards
    FACTORIES[WidgetType.Line](0, 2),
    {
      ...FACTORIES[WidgetType.Analytics](7, 2),
      w: 2,
    },
    {
      ...FACTORIES[WidgetType.Analytics](9, 2),
      w: 3,
      title:  'Bounce Rate',
      config: {
        value: '38.4%', changeValue: '-2.1%',
        changeLabel: 'vs last week', trendUp: false,
        accent: '#f59e0b',
        data: [42, 38, 45, 36, 40, 37, 39, 35, 41, 38, 36, 38],
        period: 'Last 12 days',
        selectedFields: [],
      },
    },

    // Row 5 — bar + pie + progress
    FACTORIES[WidgetType.Bar](0, 5),
    { ...FACTORIES[WidgetType.Pie](5, 5),      w: 3 },
    { ...FACTORIES[WidgetType.Progress](8, 5), w: 4 },

    // Row 8 — table + note
    FACTORIES[WidgetType.Table](0, 8),
    { ...FACTORIES[WidgetType.Note](8, 8),     w: 4 },
  ];
}
