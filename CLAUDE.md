# CLAUDE.md — DynamicDashboardBuilder

Comprehensive context for AI-assisted development on this project.

---

## Project Overview

**DynamicDashboardBuilder** (internal name: **DASHCRAFT**) is a no-code Angular dashboard builder. Users drag-and-drop widgets onto a 12-column grid canvas, configure them with data queries or static values, and publish to a read-only view mode.

- **Live URL:** deployed via GitHub Pages (`npm run deploy`)
- **Dev server:** `npm start` → `http://localhost:4200`
- **Build:** `npm run build`
- **Tests:** `npm test` (Vitest)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Angular 21.2 — standalone components, Signals, OnPush everywhere |
| Language | TypeScript 5.9 |
| Styling | SCSS with CSS custom properties (`--acc`, `--bg1`, `--txt1`, etc.) |
| UI Kit | Angular Material 21.2 (dialogs only) + Bootstrap 5 (utilities) |
| Charts | ApexCharts 5 via ng-apexcharts |
| State | Angular Signals exclusively — no NgRx, no BehaviorSubject |
| Reactivity | RxJS used only for `fromEvent` streams (wheel, resize); all component state is Signals |
| Build | Angular CLI + Vite |
| Deploy | `angular-cli-ghpages` → GitHub Pages |

---

## Directory Structure

```
src/app/
├── components/
│   ├── canvas/                 # Builder shell — layout host, keyboard shortcuts, modal orchestration
│   ├── dashboard-view/         # Read-only view mode with clock, fullscreen, type chips
│   ├── widget-card/            # Interactive widget wrapper (drag, resize, actions)
│   │   ├── widget-card.ts      # Re-export only: export { WidgetCard } from './widget-card.smooth'
│   │   └── widget-card.smooth.ts  # ACTIVE implementation — pointer API, RAF, auto-scroll, alignment guides
│   ├── widgets/                # 9 widget content components (stat, analytics, bar, line, pie, table, progress, note, section)
│   ├── sidebar/                # Widget palette, search, shortcuts reference, grid info, canvas toggles
│   ├── toolbar/                # Title edit, zoom, undo/redo, export, import, view mode, theme toggle
│   ├── minimap/                # SVG overview of canvas with scrollable viewport indicator
│   └── modals/
│       ├── add-widget-wizard/  # 2-step: type select → configure + preview
│       ├── edit-modal/         # Config + Query + Dev Tools tabs with live preview
│       ├── templates-modal/    # Pre-built dashboard templates
│       ├── import-modal/       # JSON drag-drop / file picker import
│       ├── help-modal/         # 5-tab help reference
│       └── context-menu/       # Right-click actions (edit, duplicate, lock, delete)
├── shared/                     # Reusable config panels and query builders
│   ├── config-panels/          # Per-type edit panels (edit-stat-config, edit-bar-config, etc.)
│   └── query-builder/          # Per-type query builders (stat, chart, pie, table) + filter-builder
├── services/
│   ├── dashboard.service.ts    # SINGLE SOURCE OF TRUTH — all signals live here
│   ├── query.service.ts        # Mock query engine (joins, filters, aggregations, pagination)
│   └── theme.service.ts        # Dark/light toggle, persisted to localStorage
├── core/
│   ├── interfaces.ts           # All TypeScript types — Widget, WidgetConfig union, GridPosition, etc.
│   ├── constants.ts            # All magic numbers — COLS, ROW_H, GAP, HDR_H, SIDEBAR_W, etc.
│   ├── catalog.ts              # CATALOG array — widget type registry with icon, color, defaultSize
│   ├── factories.ts            # FACTORIES map — createWidget(type, x, y) → complete Widget
│   ├── layout.utils.ts         # Pure grid math — collides, resolveLayout, resolveDrag, resolveResize, gridToPixel, packLayout
│   ├── query-types.ts          # Query system enums and config interfaces
│   ├── query-result-mapper.ts  # Transforms raw QueryResult → widget-ready display data
│   ├── data-schema.ts          # Static field pool for non-query widget configuration
│   ├── Templates.ts            # Re-exports from ProductTemplates
│   └── ProductTemplates.ts     # 3 pre-built templates (EPX Clinical, Accounting, Prescriptions)
├── styles/
│   ├── _tokens.scss            # All CSS custom properties (--acc, --bg1..4, --txt1..2, --bdr, --font-mono)
│   ├── _animations.scss        # Shared keyframes
│   └── _material.scss          # Angular Material theme overrides
└── test-cases/                 # Mock product databases (EPX, Accounting, Prescriptions JSON)
```

---

## Grid System

The canvas uses a **12-column grid** with absolute pixel positioning.

```
COLS   = 12       columns
ROW_H  = 80px     height of one row unit
GAP    = 10px     gap between all cells (horizontal AND vertical)
HDR_H  = 40px     widget card header height
MAX_WIDGET_H = 20 rows maximum widget height
```

**Coordinate conversion** (`layout.utils.ts`):
```typescript
// Grid → Pixel (used for CSS positioning of every widget card)
gridToPixel(widget, colW) → PixelRect { left, top, width, height }

// Column width is computed:
colW = computeColW(canvasW) = (canvasW - GAP * (COLS + 1)) / COLS
```

Every widget stores `{ x, y, w, h }` in grid units. `colW` is reactive — it recomputes when the canvas is resized (via ResizeObserver in Canvas component).

---

## Widget System

### The 9 Widget Types

| Type | Ctrl | Icon | Default Size | Config Interface |
|------|------|------|-------------|-----------------|
| `stat` | Ctrl+1 | ◈ | 3×2 | `StatConfig` |
| `analytics` | Ctrl+2 | ▲ | 3×2 | `AnalyticsConfig` |
| `bar` | Ctrl+3 | ▐ | 5×3 | `BarConfig` |
| `line` | Ctrl+4 | ∿ | 5×3 | `LineConfig` |
| `pie` | Ctrl+5 | ◎ | 4×3 | `PieConfig` |
| `table` | Ctrl+6 | ⊞ | 7×3 | `TableConfig` |
| `progress` | Ctrl+7 | ≡ | 4×3 | `ProgressConfig` |
| `note` | Ctrl+8 | ✎ | 3×2 | `NoteConfig` |
| `section` | Ctrl+9 | ▬ | 12×1 | `SectionConfig` |

### Adding a New Widget Type

1. Add entry to `WidgetType` enum in `interfaces.ts`
2. Define its config interface in `interfaces.ts` and add to `WidgetConfig` union
3. Add entry to `CATALOG` array in `catalog.ts` (icon, color, defaultSize)
4. Add factory function in `factories.ts` and register in `FACTORIES` map
5. Create widget component in `components/widgets/`
6. Add `@case` to widget-card template switch statement
7. Import and add to widget-card imports array
8. Add config panel in `shared/config-panels/`
9. Add query builder in `shared/query-builder/` if data-driven
10. Add case to `data-schema.ts` `applyFieldSelection()` if using static data

---

## State Management — DashboardService

**`src/app/services/dashboard.service.ts`** is the single source of truth. All state is Angular Signals. No component holds authoritative state.

### Key Signals (read-only, set via methods)

```typescript
// Core
widgets         signal<Widget[]>          // master widget array
dashTitle       signal<string>            // dashboard title
clipboard       signal<Widget | null>     // copy/paste clipboard

// Selection & interaction
selectedId      signal<string | null>     // blue border + action buttons
activeId        signal<string | null>     // currently dragging/resizing
frontId         signal<string | null>     // brought-to-front (z-index 100)
animatingId     signal<string | null>     // green flash after save (700ms)

// Canvas
canvasW         signal<number>            // updated by ResizeObserver
zoom            signal<number>            // 0.4–1.5
scrollTop       signal<number>            // reactive scroll (not DOM read)
viewportH       signal<number>

// Canvas UI toggles
showMinimap         signal<boolean>       // default true
showAlignmentGuides signal<boolean>       // default true
showGridBackground  signal<boolean>       // default true (dot-grid canvas background)

// Modals
wizardOpen      signal<boolean>
wizardInitType  signal<WidgetType | null> // null = show type selector in step 1
editingWidget   signal<Widget | null>     // null = edit modal closed
showTemplates   signal<boolean>
showImport      signal<boolean>
showHelp        signal<boolean>
contextMenu     signal<ContextMenuState | null>

// History
history         signal<HistoryEntry[]>    // deep-cloned Widget[] snapshots
histIdx         signal<number>            // current position in stack

// Responsive
compactViewport signal<boolean>           // true when window <= 1024px
sidebarOpen     signal<boolean>           // compact drawer open state
toolbarMenuOpen signal<boolean>
```

### Key Computed Signals

```typescript
colW            // (canvasW - GAP*(COLS+1)) / COLS  — pixel column width
canvasH         // max widget bottom + 120px padding
selectedWidget  // widgets().find(w => w.id === selectedId())
canUndo         // histIdx() > 0
canRedo         // histIdx() < history().length - 1
isAnyModalOpen  // any blocking modal open (contextMenu excluded — B8 fix)
zoomPercent     // "75%" display string
widgetCount     // widgets().length
lockedCount     // widgets().filter(w => w.locked).length
```

### Key Methods

```typescript
// Widget CRUD
addWidget(partial)          // adds at x=0, getNextY(), closes wizard
addWidgetAt(widget)         // adds at exact position (drag-from-sidebar), returns placed widget
duplicateWidget(widget)     // clone at bottom, scroll+select
copyWidget(widget)          // saves deep clone to clipboard signal
pasteWidget()               // pastes clipboard at bottom, scroll+select
deleteWidget(id)            // removes + clears all stale ID refs (A2 fix)
saveWidget(updated)         // updates in place + 700ms green flash
lockWidget(id)              // toggle locked (NOT undoable — C10)
bringFront(id)              // raise z-index
commitDragResize()          // push current widget positions to history (called on pointerup)

// History
undo() / redo()
pushHistory(snapshot)

// Canvas
setCanvasW(w)               // called by ResizeObserver
setScrollTop(top)           // called by scroll listener
setZoom(z) / zoomIn() / zoomOut() / resetZoom()
toggleMinimap()
toggleAlignmentGuides()
toggleGridBackground()

// Modals
openWizard(type?)  closeWizard()
openEditModal(widget)  closeEditModal()
openTemplates()  closeTemplates()
openImport()  closeImport()
openHelp()  closeHelp()
openContextMenu(id, x, y)  closeContextMenu()
closeAllModals()             // Esc key handler

// Templates & import/export
loadTemplate(id)             // resets history (C3)
loadDemo()                   // resets history (B7: clears animatingId)
exportLayout()               // downloads JSON
importLayout(jsonString)     // regenerates all IDs (C19), resets history
```

---

## Drag & Resize System — widget-card.smooth.ts

`widget-card.ts` is a thin re-export: `export { WidgetCard } from './widget-card.smooth'`. All logic lives in `widget-card.smooth.ts`.

### Tuning Constants

```typescript
DRAG_THRESHOLD_PX      = 4    // px moved before drag "engages"
TOUCH_DRAG_HOLD_MS     = 170  // ms long-press before touch drag starts
TOUCH_SCROLL_CANCEL_PX = 10   // px moved before touch becomes a scroll (not drag)
AUTO_SCROLL_EDGE_PX    = 72   // px from viewport edge to trigger canvas auto-scroll
AUTO_SCROLL_MAX_STEP_PX = 28  // max px scrolled per animation frame
ALIGNMENT_THRESHOLD_PX = 8    // px proximity to another widget edge to show guide
```

### Interaction Flow

**Mouse drag:** `pointerdown` → `engaged=false` → `pointermove` threshold → `engaged=true` → RAF `applyDragPreview()` → `pointerup` → `commitDragResize()` if layout changed

**Touch drag:** `pointerdown` → 170ms hold timer → timer fires → `engaged=true` → same as mouse. If finger moves >10px before timer fires → `cancelPendingTouchDrag()` (native scroll takes over)

**Auto-scroll:** Independent RAF loop runs while `dragRef` exists. Each frame checks pointer proximity to scroll container edges and scrolls proportionally.

**Alignment guides:** On every drag/resize RAF frame, checks 3 edge points of dragged widget against 3 edge points of every other widget. If within 8px → emits `AlignmentGuide` to service → canvas renders as dashed lines.

### Layout Resolution (layout.utils.ts)

```
resolveDrag(widget, targetX, targetY, allWidgets)
  → three-tier fallback: full move → x-only → y-only → null (blocked by locked widget)

resolveResize(widget, proposed, dir, allWidgets)
  → pushes colliding widgets down; returns null if any locked widget blocks

resolveLayout(widgets, maxPasses=60)
  → iterative collision resolution pass (called internally)
```

---

## History System

- Every change goes through `updateWidgets(fn)` which calls `pushHistory(deepClone(newWidgets))`
- History is an array of complete `Widget[]` snapshots (deep clones via `JSON.parse(JSON.stringify(...))`)
- `histIdx` points to the current position; undo = `histIdx - 1`, redo = `histIdx + 1`
- Drag/resize is special: `setWidgetPositions()` updates widgets WITHOUT pushing history (prevents flooding). `commitDragResize()` pushes a single entry on `pointerup` — C11 fix
- **Lock toggle** is deliberately NOT undoable (C10)
- **loadTemplate / loadDemo / importLayout** all RESET history to a single entry (C3)

---

## Keyboard Shortcuts

All handled in `canvas.ts` `@HostListener('document:keydown')`. Blocked when focus is on `INPUT`, `TEXTAREA`, or `SELECT` (C24 fix). Blocked entirely when any modal is open except Esc.

| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo |
| Ctrl+Y / Ctrl+Shift+Z | Redo |
| Ctrl+C | Copy selected widget to clipboard |
| Ctrl+V | Paste clipboard widget |
| Ctrl+D | Duplicate selected widget |
| Ctrl+1…9 | Add widget by type (ignores sidebar search — C18) |
| Delete / Backspace | Delete selected widget |
| L | Toggle lock on selected |
| Arrow keys | Nudge widget 1 grid unit (silent block on collision — C17) |
| Esc | Close all modals + deselect |
| Ctrl+scroll | Zoom canvas |

---

## Query System

**`src/app/services/query.service.ts`** — mock query engine with no real backend.

Three product mock databases in `src/app/test-cases/`:
- **EPX** — clinical appointments, providers, slots, patients
- **Accounting** — invoices, payments, line items
- **Prescriptions** — Rx, drugs, dispensing records

### Query Config Interfaces (query-types.ts)

```typescript
StatQueryConfig   — product, entity, field, aggregation, filters, dateRange
ChartQueryConfig  — product, entities, groupBy, series[], filters, dateRange, queryLabels
PieQueryConfig    — product, entity, labelField, valueField, aggregation, filters
TableQueryConfig  — product, entities[], columns[], filterGroups, sort, pageSize
```

### Query Builder Components (shared/query-builder/)

Each widget type has a dedicated query builder component:
- `stat-query-builder` — single entity/field/aggregation
- `chart-query-builder` — multi-series bar/line
- `pie-query-builder` — label + value fields
- `table-query-builder` — entity list, column picker, sort, pagination, filters

**Important — TableQueryBuilder pattern:**
Every picker that changes the query config MUST call `this.emit()` after updating local state. The pattern used by Sort (which works) must be followed for all other pickers:
```typescript
// CORRECT pattern — always call emit() after state update
onSortEntityChange(entity: string): void {
  this.sortEntity = entity;
  this.sortField  = this.fieldsFor(entity)[0]?.name ?? '';
  this.emit();                          // ← required
}
// All (ngModelChange) bindings on selects must also call emit()
```

---

## Audit Comment System

Bug fixes are tagged with sequential IDs embedded in code comments. This allows tracing why a specific line exists.

| Series | Domain | Examples |
|--------|--------|---------|
| **A** | Angular-specific fixes (vs React source) | A1 sync histIdx, A2 clear stale IDs on delete, A3 duplicate always scrolls |
| **B** | Data / schema bugs | B2 missing changeLabel, B3 missing subValue, B4 table rows not rebuilt, B6 missing selectedFields, B7 animatingId not cleared |
| **C** | UI / interaction bugs | C3 template resets history, C10 lock not undoable, C11 history flood on drag, C15 right-click starts resize, C16 resize overflow, C17 nudge silent block, C18 search affects shortcuts, C19 import regenerates IDs, C24 shortcuts fire in inputs |
| **M** | Modal / layout edge cases | M2 duplicate preserves x, M6 histIdx sync, M8 MIN_CANVAS_W floor |

When fixing a bug, add a comment `// Xnn fix: short description` at the fix site and at any related guard.

---

## Drag-from-Sidebar

Palette items are `draggable="true"`. On dragstart, the widget type string is set in `dataTransfer` (`text/plain`). The canvas div has `(dragover)`, `(dragleave)`, `(drop)` handlers.

On drop:
1. Client coordinates are converted to grid coords using zoom-adjusted canvas-relative position
2. `createWidget(type, gridX, gridY)` builds a full default widget from `factories.ts`
3. `svc.addWidgetAt(placed)` adds it at the exact position and returns the placed widget (with its final ID)
4. `svc.openEditModal(placed)` opens the Edit modal immediately so the user can configure it

The canvas shows a dashed accent outline (`drag-over` CSS class) while a drag is in progress over it.

---

## Canvas UI Toggles (sidebar footer)

Three on/off toggles in the sidebar footer, all backed by service signals:

| Toggle | Signal | Default |
|--------|--------|---------|
| Minimap | `showMinimap` | on |
| Alignment Guides | `showAlignmentGuides` | on |
| Grid Background | `showGridBackground` | on |

---

## Responsive Design

- **Compact breakpoint:** `<= 1024px` (`compactViewport` signal)
- In compact mode: sidebar becomes a slide-in drawer, toolbar actions overflow to a dropdown menu
- `ResizeObserver` on canvas + `window:resize` both trigger `syncResponsiveUi()`
- Scroll position and viewport height are reactive signals — minimap uses these, NOT direct DOM reads

---

## Theming

Two themes: `dark` (default) and `light`. Toggled via `ThemeService`.
- Persisted to `localStorage` key `'dashcraft-theme'`
- Applied as `data-theme` attribute on `document.documentElement`
- All colors are CSS custom properties defined in `_tokens.scss`; components never hardcode colors

---

## Pre-built Templates

Three templates in `ProductTemplates.ts`, selectable from the Templates modal:
- **EPX Clinical Dashboard** — appointments, revenue, completion rates, payor breakdown
- **Accounting Dashboard** — invoices, payments, aging, collection targets
- **Prescriptions Dashboard** — Rx volume, drug classes, dispensing activity

Loading a template **resets undo history** — this is intentional (C3).

---

## Import / Export

- **Export:** `svc.exportLayout()` — downloads `<dashTitle>.json` with `{ title, widgets }` format
- **Import:** `svc.importLayout(jsonString)` — supports current format (`{ title, widgets }`) and legacy format (raw `Widget[]`). **Always regenerates all widget IDs** to prevent collisions (C19 fix). Resets history.

---

## Common Patterns & Conventions

### Pure layout math lives in layout.utils.ts
Never call layout math inline in components. All grid functions (`collides`, `hasCollision`, `resolveLayout`, `resolveDrag`, `resolveResize`, `gridToPixel`, `packLayout`, `computeCanvasH`, `computeColW`, `getNextY`) are pure functions in `layout.utils.ts`.

### All magic numbers live in constants.ts
Never write a pixel value or count inline. Import from `constants.ts`. Add new constants there if needed.

### Widget creation always uses factories.ts
Never build a `Widget` object by hand in components. Use `createWidget(type, x, y)` or `FACTORIES[type](x, y)`.

### OnPush everywhere
Every component uses `ChangeDetectionStrategy.OnPush`. After manual state mutations, call `this.cdr.markForCheck()`.

### Signals over observables in components
Template bindings use signal reads (`svc.widgets()`, `svc.zoom()`). RxJS is only used for `fromEvent` streams that need teardown (`destroy$` Subject + `takeUntil`).

### No stale modal IDs
When deleting a widget, `deleteWidget()` clears `selectedId`, `frontId`, `animatingId`, and closes the edit modal if it was open for that widget — A2 fix. Always go through `deleteWidget()`, never mutate `widgets` directly.

### History entries are deep clones
`pushHistory()` always receives `deepClone(widgets)`. Never pass a reference. This is the A6 fix — mutations from drag operations must not affect history snapshots.

### Emit after every state change in query builders
Query builder components (`StatQueryBuilder`, `ChartQueryBuilder`, `PieQueryBuilder`, `TableQueryBuilder`) must call `this.emit()` after every change to local state that affects the query config. The pattern from `onSortEntityChange` (which calls `emit()`) is the reference implementation.

---

## Known Working Branch: responsive-devices

The current active branch adds:
- Full pointer API (mouse + touch) in widget-card.smooth.ts
- Auto-scroll during drag (edge detection)
- Compact sidebar/toolbar for narrow viewports
- Scroll sync between canvas and minimap
- Full query system with 3 mock product databases
- Global filter bar component

The `master` branch is the stable baseline. PRs should target `master`.
