// ═══════════════════════════════════════════════════════════════
//  DASHCRAFT — Core Constants
//  Single source of truth for all magic numbers and pure helpers
//  Direct port from React source constants
// ═══════════════════════════════════════════════════════════════


// ───────────────────────────────────────────────────────────────
//  GRID SYSTEM CONSTANTS
// ───────────────────────────────────────────────────────────────

/**
 * Number of columns in the grid
 * All x positions and widths are relative to this
 * Range: widget.x = 0 to COLS-1, widget.w = 1 to COLS
 */
export const COLS = 12;

/**
 * Height of each grid row in pixels
 * Actual rendered pixel height of one row unit
 * widget.h = 2 means widget is (2 * ROW_H) + (1 * GAP) tall
 */
export const ROW_H = 80;

/**
 * Gap between grid cells in pixels
 * Applied between columns AND between rows
 * Same value used for both horizontal and vertical spacing
 */
export const GAP = 10;

/**
 * Widget header height in pixels
 * Content area height = total widget height - HDR_H
 */
export const HDR_H = 40;

/**
 * Sidebar width in pixels
 * Used for initial canvasW calculation:
 * canvasW = window.innerWidth - SIDEBAR_W - 2
 */
export const SIDEBAR_W = 210;

/**
 * Top toolbar height in pixels
 * Canvas starts below this
 */
export const TOOLBAR_H = 52;

/**
 * Minimum canvas width in pixels
 * Prevents colW going negative on very narrow viewports
 * Also used as SSR fallback (window not available)
 * Edge case guard: M8 from audit
 */
export const MIN_CANVAS_W = 600;

/**
 * Maximum widget height in rows
 * Hard cap applied during resize
 * ~1,730px at default 80px row height + 10px gap
 */
export const MAX_WIDGET_H = 20;

/**
 * Maximum layout resolution passes
 * resolveLayout() runs up to this many passes
 * before returning partially-resolved layout
 */
export const MAX_LAYOUT_PASSES = 60;

/**
 * Maximum packLayout iterations per widget
 * Safety cap prevents infinite loop on degenerate layouts
 */
export const MAX_PACK_ITERATIONS = 200;

/**
 * Widget save animation duration in milliseconds
 * Green flash after saving from Edit Modal
 */
export const SAVE_ANIMATION_MS = 700;

/**
 * Zoom range constants
 */
export const ZOOM_MIN  = 0.4;
export const ZOOM_MAX  = 1.5;
export const ZOOM_STEP = 0.1;

/**
 * Live clock update interval in milliseconds
 * Used in DashboardView — updates every 60 seconds
 */
export const CLOCK_INTERVAL_MS = 60_000;

/**
 * Minimap width in pixels
 * Scale factor = MINIMAP_W / canvasW
 */
export const MINIMAP_W = 160;


// ───────────────────────────────────────────────────────────────
//  CHART COLORS
// ───────────────────────────────────────────────────────────────

/**
 * Ordered color palette for chart series
 * Used by bar, line, pie charts when assigning colors
 * Direct port from React CHART_COLORS constant
 */
export const CHART_COLORS: string[] = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#a78bfa', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
];


// ───────────────────────────────────────────────────────────────
//  STATUS MAP
// ───────────────────────────────────────────────────────────────

/**
 * Status badge color map for table widget
 * Maps status string values to background + foreground colors
 * statusColumn: true in TableConfig activates this
 */
export const STATUS_MAP: Record<string, { bg: string; fg: string; label: string }> = {
  paid:     { bg: '#052e16', fg: '#22c55e', label: 'Paid'     },
  pending:  { bg: '#2d1b01', fg: '#f59e0b', label: 'Pending'  },
  failed:   { bg: '#2d0707', fg: '#ef4444', label: 'Failed'   },
  active:   { bg: '#03224c', fg: '#3b82f6', label: 'Active'   },
  inactive: { bg: '#1c1c1c', fg: '#64748b', label: 'Inactive' },
  shipped:  { bg: '#052e16', fg: '#10b981', label: 'Shipped'  },
  refunded: { bg: '#2a1a3e', fg: '#a78bfa', label: 'Refunded' },
  draft:    { bg: '#1c1c1c', fg: '#64748b', label: 'Draft'    },
};

/**
 * Fallback status style for unknown status values
 */
export const STATUS_FALLBACK: { bg: string; fg: string; label: string } = {
  bg:    '#1c1c1c',
  fg:    '#94a3b8',
  label: '',
};


// ───────────────────────────────────────────────────────────────
//  KEYBOARD SHORTCUT MAP
// ───────────────────────────────────────────────────────────────

/**
 * Ctrl+1 through Ctrl+9 map to CATALOG indices (0-based)
 * Used by keyboard handler in DashboardService
 */
export const KB_CATALOG_OFFSET = 1; // Ctrl+1 = CATALOG[0]

/**
 * Tags that should block keyboard shortcuts when focused
 * Prevents Ctrl+D, Del, L etc. firing while typing in inputs
 * Edge case C24 from audit
 */
export const KB_BLOCKED_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * Keyboard shortcut reference list
 * Used by sidebar and help modal display
 */
export const KEYBOARD_SHORTCUTS: { key: string; tip: string }[] = [
  { key: 'Ctrl+Z / Y',  tip: 'Undo / Redo'          },
  { key: 'Ctrl+D',      tip: 'Duplicate selected'    },
  { key: 'Ctrl+1…9',    tip: 'Add widget by type'    },
  { key: 'Del',         tip: 'Delete selected'       },
  { key: 'L',           tip: 'Lock / unlock'         },
  { key: '↑↓←→',        tip: 'Nudge widget'          },
  { key: 'Esc',         tip: 'Deselect / close'      },
  { key: 'Ctrl+scroll', tip: 'Zoom canvas'           },
];


// ───────────────────────────────────────────────────────────────
//  PURE HELPER FUNCTIONS
// ───────────────────────────────────────────────────────────────

/**
 * Generate a unique widget ID
 * 7-character base-36 string (~78 billion combinations)
 * Collision probability for <1,000 widgets is ~6×10⁻⁹
 * All IDs are regenerated on import to prevent collisions
 *
 * @returns Random 7-character alphanumeric string
 *
 * @example
 * uid() // → 'k7x2m9q'
 */
export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

/**
 * Clamp a number between a minimum and maximum value
 * Used extensively in drag, resize, zoom, and nudge logic
 *
 * @param value - The number to clamp
 * @param min   - Minimum allowed value (inclusive)
 * @param max   - Maximum allowed value (inclusive)
 * @returns The clamped value
 *
 * @example
 * clamp(15, 0, 12)  // → 12
 * clamp(-1, 0, 12)  // → 0
 * clamp(5,  0, 12)  // → 5
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Deep clone any serializable object using JSON
 * Used for history snapshots to prevent mutation issues
 * Critical for angular-gridster2 compatibility (A6 from audit)
 *
 * @param obj - Any JSON-serializable object
 * @returns A completely independent deep copy
 *
 * @example
 * const snapshot = deepClone(widgets);
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Compute initial canvas width safely
 * Applies the 600px floor and SSR window guard
 * Edge case M8 / A5 from audit
 *
 * @returns Safe initial canvas width in pixels
 */
export function initialCanvasW(): number {
  if (typeof window === 'undefined') {
    return MIN_CANVAS_W; // SSR fallback
  }
  return Math.max(MIN_CANVAS_W, window.innerWidth - SIDEBAR_W - 2);
}

/**
 * Format a dashboard title for use as a filename
 * Spaces → hyphens, all lowercase
 *
 * @param title - Raw dashboard title string
 * @returns URL/filename-safe string
 *
 * @example
 * toFilename('My Dashboard') // → 'my-dashboard'
 */
export function toFilename(title: string): string {
  return title.replace(/\s+/g, '-').toLowerCase();
}