// ═══════════════════════════════════════════════════════════════
//  DASHCRAFT — Widget CATALOG
//  Master registry of all 9 widget types
//
//  Used by:
//  ├── Sidebar palette (display + click to open wizard)
//  ├── Add Widget Wizard Step 1 (type selection grid)
//  ├── Ctrl+1–9 keyboard shortcuts (index-based lookup)
//  ├── Minimap (color coding per widget type)
//  ├── Dashboard View (type breakdown chips in topbar)
//  ├── Widget card header (icon + color)
//  └── Edit Modal (type label display)
//
//  Direct port from React CATALOG array
//  Order matters — Ctrl+1 = index 0, Ctrl+9 = index 8
// ═══════════════════════════════════════════════════════════════

import { CatalogItem, WidgetType } from './interfaces';


export const CATALOG: CatalogItem[] = [

  // ── Index 0 → Ctrl+1 ──────────────────────────────────────
  {
    type:        WidgetType.Stat,
    label:       'Stat Card',
    icon:        '◈',
    color:       '#3b82f6',
    desc:        'Single KPI with trend indicator',
    defaultSize: { w: 3, h: 2 },
  },

  // ── Index 1 → Ctrl+2 ──────────────────────────────────────
  {
    type:        WidgetType.Analytics,
    label:       'Analytics Card',
    icon:        '▲',
    color:       '#22c55e',
    desc:        'Metric with sparkline chart',
    defaultSize: { w: 3, h: 2 },
  },

  // ── Index 2 → Ctrl+3 ──────────────────────────────────────
  {
    type:        WidgetType.Bar,
    label:       'Bar Chart',
    icon:        '▐',
    color:       '#f59e0b',
    desc:        'Compare values across categories',
    defaultSize: { w: 5, h: 3 },
  },

  // ── Index 3 → Ctrl+4 ──────────────────────────────────────
  {
    type:        WidgetType.Line,
    label:       'Line / Area Chart',
    icon:        '∿',
    color:       '#06b6d4',
    desc:        'Trend and time-series data',
    defaultSize: { w: 5, h: 3 },
  },

  // ── Index 4 → Ctrl+5 ──────────────────────────────────────
  {
    type:        WidgetType.Pie,
    label:       'Donut Chart',
    icon:        '◎',
    color:       '#a78bfa',
    desc:        'Part-to-whole distribution',
    defaultSize: { w: 4, h: 3 },
  },

  // ── Index 5 → Ctrl+6 ──────────────────────────────────────
  {
    type:        WidgetType.Table,
    label:       'Data Table',
    icon:        '⊞',
    color:       '#38bdf8',
    desc:        'Tabular data with status badges',
    defaultSize: { w: 7, h: 3 },
  },

  // ── Index 6 → Ctrl+7 ──────────────────────────────────────
  {
    type:        WidgetType.Progress,
    label:       'Progress Bars',
    icon:        '≡',
    color:       '#f97316',
    desc:        'Multi-metric progress display',
    defaultSize: { w: 4, h: 3 },
  },

  // ── Index 7 → Ctrl+8 ──────────────────────────────────────
  {
    type:        WidgetType.Note,
    label:       'Text / Note',
    icon:        '✎',
    color:       '#94a3b8',
    desc:        'Free-text annotation block',
    defaultSize: { w: 3, h: 2 },
  },

  // ── Index 8 → Ctrl+9 ──────────────────────────────────────
  {
    type:        WidgetType.Section,
    label:       'Section Label',
    icon:        '▬',
    color:       '#64748b',
    desc:        'Visual divider with title',
    defaultSize: { w: 12, h: 1 },
  },

];


// ───────────────────────────────────────────────────────────────
//  CATALOG LOOKUP HELPERS
// ───────────────────────────────────────────────────────────────

/**
 * Get a catalog item by widget type
 * Returns undefined if type not found
 */
export function getCatalogItem(type: WidgetType): CatalogItem | undefined {
  return CATALOG.find(c => c.type === type);
}

/**
 * Get a catalog item by its keyboard shortcut index
 * Ctrl+1 = index 0, Ctrl+9 = index 8
 */
export function getCatalogByIndex(index: number): CatalogItem | undefined {
  return CATALOG[index];
}

/**
 * Get the accent color for a widget type
 * Falls back to default border color if type not found
 */
export function getCatalogColor(type: WidgetType): string {
  return getCatalogItem(type)?.color ?? '#1e2d42';
}

/**
 * Get the icon character for a widget type
 */
export function getCatalogIcon(type: WidgetType): string {
  return getCatalogItem(type)?.icon ?? '◈';
}

/**
 * Filter catalog items by search query
 * Matches against both label and desc (case-insensitive)
 */
export function filterCatalog(query: string): CatalogItem[] {
  if (!query.trim()) return CATALOG;
  const q = query.toLowerCase();
  return CATALOG.filter(
    item =>
      item.label.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q)
  );
}

/**
 * Get widget type breakdown counts from a widget array
 * Used by Dashboard View topbar type chips
 */
export function getTypeBreakdown(
  widgets: { type: WidgetType }[]
): { label: string; color: string; count: number }[] {
  return CATALOG
    .map(c => ({
      label: c.label,
      color: c.color,
      count: widgets.filter(w => w.type === c.type).length,
    }))
    .filter(c => c.count > 0);
}
