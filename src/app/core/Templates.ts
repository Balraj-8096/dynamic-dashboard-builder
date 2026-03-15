// ═══════════════════════════════════════════════════════════════
//  DASHCRAFT — Pre-built Dashboard Templates
//
//  Four templates: Sales, Marketing, DevOps, Finance
//
//  Each template:
//  ├── Calls FACTORIES[type](x, y) for base widget
//  ├── Spreads custom config overrides on top
//  ├── Returns a complete Widget[] ready to render
//  └── Gets fresh uid() for every widget via FACTORIES
//
//  Loading a template:
//  ├── Replaces widgets[] entirely
//  ├── RESETS history stack to [templateWidgets]
//  ├── NOT undoable back to before template load (C3 audit)
//  └── Sets dashTitle to template name
// ═══════════════════════════════════════════════════════════════

import { DashboardTemplate, Widget } from './interfaces';
import { FACTORIES }                 from './factories';


// ───────────────────────────────────────────────────────────────
//  TEMPLATE BUILDERS
// ───────────────────────────────────────────────────────────────

function buildSales(): Widget[] {
  return [
    // Row 0 — 4 stat cards
    {
      ...FACTORIES['stat'](0, 0),
      title:  'Total Revenue',
      config: {
        value: '$124,580', subValue: 'vs last month',
        trend: '+18.4%', trendUp: true, accent: '#3b82f6',
        prefix: '', suffix: '', description: 'Monthly recurring revenue',
        showSparkline: true,
        sparkData: [30, 42, 38, 55, 48, 64, 58, 72, 68, 84],
        selectedFields: [],
      },
    },
    {
      ...FACTORIES['stat'](3, 0),
      title:  'Total Orders',
      config: {
        value: '2,847', subValue: 'this month',
        trend: '+12.1%', trendUp: true, accent: '#22c55e',
        prefix: '', suffix: '', description: 'Completed orders',
        showSparkline: true,
        sparkData: [180, 220, 195, 240, 210, 260, 230, 270, 245, 280],
        selectedFields: [],
      },
    },
    {
      ...FACTORIES['stat'](6, 0),
      title:  'Conversion Rate',
      config: {
        value: '3.84', subValue: 'checkout rate',
        trend: '-0.3%', trendUp: false, accent: '#f59e0b',
        prefix: '', suffix: '%', description: 'Visitors who purchased',
        showSparkline: true,
        sparkData: [4.2, 3.8, 4.5, 3.2, 3.6, 4.1, 3.9, 3.5, 4.0, 3.8],
        selectedFields: [],
      },
    },
    {
      ...FACTORIES['stat'](9, 0),
      title:  'Avg. Order Value',
      config: {
        value: '127.40', subValue: 'per transaction',
        trend: '+8.1%', trendUp: true, accent: '#a78bfa',
        prefix: '$', suffix: '', description: 'Mean order value',
        showSparkline: true,
        sparkData: [110, 95, 130, 118, 142, 125, 138, 120, 145, 127],
        selectedFields: [],
      },
    },

    // Row 2 — line chart + 2 analytics
    FACTORIES['line'](0, 2),
    {
      ...FACTORIES['analytics'](7, 2),
      w: 2,
    },
    {
      ...FACTORIES['analytics'](9, 2),
      w: 3,
      title:  'Bounce Rate',
      config: {
        value: '38.4%', changeValue: '-2.1%',
        changeLabel: 'vs last week', trendUp: false,
        accent: '#f59e0b',
        data: [42, 38, 45, 36, 40, 37, 39, 35, 41, 38, 36, 38],
        period: 'Last 12 days',
      },
    },

    // Row 5 — bar + pie + progress
    FACTORIES['bar'](0, 5),
    { ...FACTORIES['pie'](5, 5), w: 3 },
    { ...FACTORIES['progress'](8, 5), w: 4 },

    // Row 8 — table + note
    FACTORIES['table'](0, 8),
    { ...FACTORIES['note'](8, 8), w: 4 },
  ];
}

function buildMarketing(): Widget[] {
  return [
    // Section header
    {
      ...FACTORIES['section'](0, 0),
      title: 'Section',
      config: {
        label: 'Marketing KPIs',
        accent: '#22c55e',
        showLine: true,
        align: 'left' as const,
      },
    },

    // Row 1 — stat cards
    {
      ...FACTORIES['stat'](0, 1),
      title: 'Sessions',
      config: {
        value: '54,219', subValue: 'this month',
        trend: '+9.3%', trendUp: true, accent: '#22c55e',
        prefix: '', suffix: '', description: 'Total sessions',
        showSparkline: true,
        sparkData: [35, 42, 38, 48, 44, 52, 46, 55, 50, 60],
        selectedFields: [],
      },
    },
    {
      ...FACTORIES['stat'](3, 1),
      title: 'Bounce Rate',
      config: {
        value: '38.4%', subValue: 'avg session',
        trend: '-2.1%', trendUp: false, accent: '#f59e0b',
        prefix: '', suffix: '', description: 'Bounce rate',
        showSparkline: true,
        sparkData: [42, 38, 45, 36, 40, 37, 39, 35, 41, 38],
        selectedFields: [],
      },
    },
    {
      ...FACTORIES['stat'](6, 1),
      title: 'Conversion',
      config: {
        value: '3.84%', subValue: 'conversion rate',
        trend: '+0.5%', trendUp: true, accent: '#3b82f6',
        prefix: '', suffix: '', description: 'Conversion rate',
        showSparkline: true,
        sparkData: [3.2, 3.5, 3.8, 3.4, 3.9, 4.1, 3.7, 4.0, 3.8, 3.84],
        selectedFields: [],
      },
    },
    {
      ...FACTORIES['stat'](9, 1),
      title: 'New Signups',
      config: {
        value: '1,820', subValue: 'this quarter',
        trend: '+22.3%', trendUp: true, accent: '#a78bfa',
        prefix: '', suffix: '', description: 'New signups Q4',
        showSparkline: true,
        sparkData: [1240, 1580, 1390, 1820],
        selectedFields: [],
      },
    },

    // Row 3 — line + pie
    { ...FACTORIES['line'](0, 3),  w: 7 },
    { ...FACTORIES['pie'](7, 3),   w: 5 },

    // Row 6 — bar + progress
    { ...FACTORIES['bar'](0, 6),   w: 7 },
    { ...FACTORIES['progress'](7, 6), w: 5 },

    // Row 9 — table
    FACTORIES['table'](0, 9),
  ];
}

function buildDevOps(): Widget[] {
  return [
    // Section header
    {
      ...FACTORIES['section'](0, 0),
      config: {
        label: 'DevOps Health',
        accent: '#06b6d4',
        showLine: true,
        align: 'left' as const,
      },
    },

    // Row 1 — stat cards
    {
      ...FACTORIES['stat'](0, 1),
      title: 'Uptime',
      config: {
        value: '99.97%', subValue: 'last 30 days',
        trend: '+0.02%', trendUp: true, accent: '#22c55e',
        prefix: '', suffix: '', description: 'System uptime',
        showSparkline: true,
        sparkData: [99.9, 99.95, 99.8, 99.97, 100, 99.99, 99.97, 100, 99.98, 99.97],
        selectedFields: [],
      },
    },
    {
      ...FACTORIES['stat'](3, 1),
      title: 'Deployments',
      config: {
        value: '142', subValue: 'this month',
        trend: '+18%', trendUp: true, accent: '#3b82f6',
        prefix: '', suffix: '', description: 'Total deployments',
        showSparkline: true,
        sparkData: [85, 98, 110, 102, 125, 118, 130, 122, 138, 142],
        selectedFields: [],
      },
    },
    {
      ...FACTORIES['stat'](6, 1),
      title: 'Error Rate',
      config: {
        value: '0.42%', subValue: 'avg error rate',
        trend: '-0.18%', trendUp: false, accent: '#ef4444',
        prefix: '', suffix: '', description: 'API error rate',
        showSparkline: true,
        sparkData: [0.8, 0.7, 0.65, 0.6, 0.55, 0.5, 0.48, 0.45, 0.44, 0.42],
        selectedFields: [],
      },
    },
    {
      ...FACTORIES['stat'](9, 1),
      title: 'MTTR',
      config: {
        value: '12m', subValue: 'mean time to resolve',
        trend: '-8m', trendUp: false, accent: '#f97316',
        prefix: '', suffix: '', description: 'Mean time to resolve',
        showSparkline: true,
        sparkData: [35, 28, 25, 22, 20, 18, 16, 15, 13, 12],
        selectedFields: [],
      },
    },

    // Row 3 — line + progress
    { ...FACTORIES['line'](0, 3),     w: 7 },
    { ...FACTORIES['progress'](7, 3), w: 5 },

    // Row 6 — bar + pie
    { ...FACTORIES['bar'](0, 6),  w: 7 },
    { ...FACTORIES['pie'](7, 6),  w: 5 },
  ];
}

function buildFinance(): Widget[] {
  return [
    // Section header
    {
      ...FACTORIES['section'](0, 0),
      config: {
        label: 'Finance Summary',
        accent: '#10b981',
        showLine: true,
        align: 'left' as const,
      },
    },

    // Row 1 — stat cards
    {
      ...FACTORIES['stat'](0, 1),
      title: 'MRR',
      config: {
        value: '$48,290', subValue: 'monthly recurring',
        trend: '+22.1%', trendUp: true, accent: '#10b981',
        prefix: '', suffix: '', description: 'Monthly recurring revenue',
        showSparkline: true,
        sparkData: [28, 35, 32, 42, 38, 48, 44, 52, 48, 58],
        selectedFields: [],
      },
    },
    {
      ...FACTORIES['stat'](3, 1),
      title: 'ARR',
      config: {
        value: '$579,480', subValue: 'annual recurring',
        trend: '+22.1%', trendUp: true, accent: '#3b82f6',
        prefix: '', suffix: '', description: 'Annual recurring revenue',
        showSparkline: true,
        sparkData: [336, 420, 384, 504, 456, 576, 528, 624, 576, 696],
        selectedFields: [],
      },
    },
    {
      ...FACTORIES['stat'](6, 1),
      title: 'Avg. LTV',
      config: {
        value: '$1,240', subValue: 'per customer',
        trend: '+6.5%', trendUp: true, accent: '#a78bfa',
        prefix: '', suffix: '', description: 'Average lifetime value',
        showSparkline: true,
        sparkData: [980, 1020, 1050, 1080, 1100, 1130, 1160, 1180, 1200, 1240],
        selectedFields: [],
      },
    },
    {
      ...FACTORIES['stat'](9, 1),
      title: 'Churn Rate',
      config: {
        value: '2.1%', subValue: 'monthly churn',
        trend: '+0.4%', trendUp: false, accent: '#ef4444',
        prefix: '', suffix: '', description: 'Monthly churn rate',
        showSparkline: true,
        sparkData: [1.8, 2.0, 1.9, 2.2, 2.0, 2.3, 2.1, 2.4, 2.2, 2.1],
        selectedFields: [],
      },
    },

    // Row 3 — line + pie
    { ...FACTORIES['line'](0, 3),  w: 7 },
    { ...FACTORIES['pie'](7, 3),   w: 5 },

    // Row 6 — bar + table
    { ...FACTORIES['bar'](0, 6),   w: 5 },
    { ...FACTORIES['table'](5, 6), w: 7 },
  ];
}


// ───────────────────────────────────────────────────────────────
//  TEMPLATES ARRAY
// ───────────────────────────────────────────────────────────────

export const TEMPLATES: DashboardTemplate[] = [
  {
    id:          'sales',
    name:        'Sales Overview',
    description: 'Revenue, orders, conversion, monthly trends',
    icon:        '◈',
    color:       '#3b82f6',
    build:       buildSales,
  },
  {
    id:          'marketing',
    name:        'Marketing KPIs',
    description: 'Sessions, bounce, traffic sources, campaigns',
    icon:        '▲',
    color:       '#22c55e',
    build:       buildMarketing,
  },
  {
    id:          'devops',
    name:        'DevOps Health',
    description: 'Uptime, deployments, error rate, MTTR',
    icon:        '⊞',
    color:       '#06b6d4',
    build:       buildDevOps,
  },
  {
    id:          'finance',
    name:        'Finance Summary',
    description: 'MRR, ARR, LTV, churn, P&L',
    icon:        '◎',
    color:       '#10b981',
    build:       buildFinance,
  },
];

export function buildSalesDemo(): Widget[] {
    return buildSales();
}