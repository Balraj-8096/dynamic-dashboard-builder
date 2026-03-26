# DynamicDashboardBuilder — Complete Reference Documentation

> **Internal Name:** DASHCRAFT
> **Version:** Angular 21.2
> **Build:** `npm run build` · **Dev:** `npm start` (localhost:4200) · **Deploy:** `npm run deploy`

---

## Table of Contents

1. [Application Overview](#1-application-overview)
2. [Getting Started](#2-getting-started)
3. [Core Concepts](#3-core-concepts)
   - [The Canvas & Grid System](#31-the-canvas--grid-system)
   - [Widget Architecture](#32-widget-architecture)
   - [State Management](#33-state-management)
4. [The Canvas Builder](#4-the-canvas-builder)
   - [Toolbar](#41-toolbar)
   - [Sidebar](#42-sidebar)
   - [Canvas Area](#43-canvas-area)
   - [Minimap](#44-minimap)
5. [Widget Reference](#5-widget-reference)
   - [Stat](#51-stat-widget)
   - [Analytics](#52-analytics-widget)
   - [Bar Chart](#53-bar-chart-widget)
   - [Line Chart](#54-line-chart-widget)
   - [Pie / Donut Chart](#55-pie--donut-chart-widget)
   - [Table](#56-table-widget)
   - [Progress Bars](#57-progress-bars-widget)
   - [Note](#58-note-widget)
   - [Section Divider](#59-section-divider-widget)
6. [Adding & Configuring Widgets](#6-adding--configuring-widgets)
   - [Add Widget Wizard](#61-add-widget-wizard)
   - [Edit Modal](#62-edit-modal)
   - [Context Menu](#63-context-menu)
7. [Drag, Resize & Layout](#7-drag-resize--layout)
   - [Dragging Widgets](#71-dragging-widgets)
   - [Resizing Widgets](#72-resizing-widgets)
   - [Auto-Scroll](#73-auto-scroll)
   - [Alignment Guides](#74-alignment-guides)
   - [Pack Layout](#75-pack-layout)
   - [Widget Nudging](#76-widget-nudging)
8. [Query System](#8-query-system)
   - [Overview](#81-overview)
   - [Query Builders by Widget Type](#82-query-builders-by-widget-type)
   - [Filter Builder](#83-filter-builder)
   - [Per-Widget Date Filter](#84-per-widget-date-filter)
   - [Mock Databases](#85-mock-databases)
9. [Advanced Widget Features](#9-advanced-widget-features)
   - [Color Thresholds](#91-color-thresholds)
   - [Number Formatting](#92-number-formatting)
   - [Reference Lines](#93-reference-lines)
   - [Progress Color Rules](#94-progress-color-rules)
   - [Widget Pinning](#95-widget-pinning)
10. [Dashboard View Mode](#10-dashboard-view-mode)
11. [Undo / Redo History](#11-undo--redo-history)
12. [Import & Export](#12-import--export)
13. [Pre-built Templates](#13-pre-built-templates)
14. [Keyboard Shortcuts](#14-keyboard-shortcuts)
15. [Theming](#15-theming)
16. [Responsive Design](#16-responsive-design)
17. [Developer Reference](#17-developer-reference)
    - [Directory Structure](#171-directory-structure)
    - [Tech Stack](#172-tech-stack)
    - [Grid Math & Layout Utils](#173-grid-math--layout-utils)
    - [Signals Architecture](#174-signals-architecture)
    - [History System Internals](#175-history-system-internals)
    - [Drag System Internals](#176-drag-system-internals)
    - [Adding a New Widget Type](#177-adding-a-new-widget-type)
    - [Audit Comment Tags](#178-audit-comment-tags)
    - [Key Constants](#179-key-constants)

---

## 1. Application Overview

DynamicDashboardBuilder (DASHCRAFT) is a **no-code Angular dashboard builder**. Users compose dashboards by dragging and dropping widgets onto a 12-column grid canvas, configuring each widget with either static data or live mock-database queries, and publishing to a clean read-only view mode.

**What it does:**
- Drag-and-drop widget placement on a resizable grid canvas
- 9 widget types: KPI stats, analytics cards, bar/line/pie charts, tables, progress bars, notes, and dividers
- Live mock query engine against 3 product databases (clinical, accounting, prescriptions)
- Undo/redo history for every canvas action
- Import/export dashboards as JSON
- 3 pre-built templates to start from
- Dark and light themes
- Responsive layout for both desktop and tablet viewports
- Read-only view mode with live clock and fullscreen support

---

## 2. Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm start
# → http://localhost:4200

# Build for production
npm run build

# Run tests (Vitest)
npm test

# Deploy to GitHub Pages
npm run deploy
```

**First steps:**
1. Open the app — a blank canvas with the sidebar on the left and toolbar on top is shown.
2. Click any widget type in the sidebar palette, or drag one onto the canvas.
3. The **Add Widget Wizard** opens. Configure the widget then click **Add**.
4. Select a widget to reveal action buttons (edit, duplicate, lock, delete).
5. Drag or resize widgets freely. All changes are undoable with Ctrl+Z.
6. Click **View Mode** in the toolbar to see the published read-only dashboard.

**Quick start with a template:**
- Click **Templates** in the toolbar or sidebar footer.
- Choose from EPX Clinical, Accounting, or Prescriptions dashboards.
- Edit any widget by double-clicking or using the right-click context menu.

---

## 3. Core Concepts

### 3.1 The Canvas & Grid System

The canvas uses a **12-column absolute-position grid**:

| Constant | Value | Description |
|----------|-------|-------------|
| Columns | 12 | Number of grid columns |
| Default Row Height | 80 px | Height of one row unit (configurable: 60 / 80 / 100 / 120) |
| Gap | 10 px | Spacing between all grid cells (horizontal and vertical) |
| Header Height | 40 px | Widget card header strip |
| Max Widget Height | 20 rows | Tallest a widget can be resized to |
| Min Canvas Width | 600 px | Floor for SSR and very small viewports |

Every widget stores its position and size as **grid units** `{ x, y, w, h }`. The canvas converts these to pixel coordinates at render time using `colW` (computed column width):

```
colW = (canvasW − GAP × (COLS + 1)) / COLS
```

`colW` reacts automatically when the browser window or canvas container resizes.

**Row Height** is a per-dashboard setting (not per-widget). Change it in the sidebar Grid Info panel. Allowed values: 60, 80, 100, 120 px.

### 3.2 Widget Architecture

Each widget on the canvas is composed of two layers:

1. **WidgetCard** (`widget-card.smooth.ts`) — the interactive shell. Handles drag/resize, the action-button header strip, selection highlight, lock indicator, and z-index management.
2. **Widget content component** (`components/widgets/<type>-widget.ts`) — renders the actual data visualization inside the card.

Every widget in the data model is a `Widget` object:

```typescript
interface Widget {
  id: string;          // 7-char random ID
  type: WidgetType;    // stat | analytics | bar | line | pie | table | progress | note | section
  title: string;       // displayed in card header
  locked: boolean;     // prevents drag/resize/delete when true
  pinned?: boolean;    // layout anchor — other widgets cannot push it
  x: number;           // grid column (0-based)
  y: number;           // grid row (0-based)
  w: number;           // width in columns
  h: number;           // height in rows
  config: WidgetConfig; // type-specific configuration union
}
```

### 3.3 State Management

All application state lives in **`DashboardService`** as Angular Signals. Components never hold authoritative state — they read from service signals and call service methods.

Key rules:
- **Never mutate `widgets` directly** from a component. Always call a service method.
- **Never build a `Widget` by hand.** Use `createWidget(type, x, y)` from `factories.ts`.
- **Never hardcode pixel values.** Import from `constants.ts`.
- Every `updateWidgets()` call automatically pushes a history snapshot.

---

## 4. The Canvas Builder

### 4.1 Toolbar

The toolbar runs across the top of the screen and provides global actions:

| Control | Description |
|---------|-------------|
| **Title field** | Click to edit the dashboard name. Press Enter or click away to save. |
| **Zoom out / in / reset** | Scale canvas between 40% and 150% (step 10%). Also Ctrl+scroll. |
| **Zoom percentage display** | Shows current zoom level (e.g., "100%"). |
| **Undo / Redo** | Navigate the undo stack. Buttons are disabled at stack boundaries. |
| **Add Widget** | Opens the Add Widget Wizard at the type-selection step. |
| **Pack Layout** | Collapses vertical gaps — slides all widgets up to fill empty rows. |
| **Clear All** | Removes every widget from the canvas (adds to history). |
| **Import** | Opens the Import modal for JSON files. |
| **Export** | Downloads the current dashboard as `<title>.json`. |
| **Templates** | Opens the pre-built template picker. |
| **Help** | Opens the 5-tab Help modal. |
| **View Mode** | Navigates to the read-only view at the `/view` route. |
| **Theme toggle** | Switches between dark and light themes. |

In **compact viewport** (≤ 1024 px) the toolbar collapses overflow actions into a dropdown menu accessible via a menu button.

### 4.2 Sidebar

The left sidebar (210 px wide) contains:

**Widget Palette**
- A grid of all 9 widget types with icon and name.
- Type to filter using the search input above the palette.
- **Click** a type → opens Add Widget Wizard with that type pre-selected.
- **Drag** a type card → drop anywhere on the canvas to place it at that exact position. The Edit modal opens immediately for configuration.

**Keyboard Shortcuts panel**
- Display-only reference list of all shortcuts.

**Grid Info panel**
- Shows: Columns (12), Row Height (selector), Column Width (computed px), Zoom %, Widget Count, Locked Count.
- Use the Row Height selector to change the per-dashboard row height.

**Canvas Toggles** (sidebar footer)

| Toggle | Default | Description |
|--------|---------|-------------|
| Minimap | On | Shows/hides the overview minimap |
| Alignment Guides | On | Shows/hides snap guide lines during drag/resize |
| Grid Background | On | Shows/hides the dot grid on the canvas |

**Sidebar footer actions**
- **Browse Templates** — opens template picker.
- **Load Demo** — loads a sample dashboard (resets history).

In **compact viewport** the sidebar becomes a slide-in drawer, toggled by the menu icon in the toolbar.

### 4.3 Canvas Area

The main working area:

- **Grid background** — subtle dot grid to aid alignment (toggleable).
- **Drag from sidebar** — dragging a palette item onto the canvas shows a dashed accent border. On drop, the widget is placed at the nearest grid position and the Edit modal opens.
- **Right-click** on any widget — opens the Context Menu (edit, duplicate, lock, delete).
- **Click** on a widget — selects it (blue border). Click outside to deselect.
- **Ctrl+Scroll** over canvas — zooms in/out.
- **Auto-scroll** — while dragging or resizing, if the pointer approaches within 72 px of the scroll edge the canvas scrolls automatically.

### 4.4 Minimap

An SVG overview panel (160 px wide) that renders all widgets as proportionally-sized rectangles. The current viewport is shown as a shaded region that updates as you scroll. Clicking the minimap scrolls the canvas to that position.

Toggle the minimap via the sidebar toggle or `toggleMinimap()`.

---

## 5. Widget Reference

### 5.1 Stat Widget

**Purpose:** Single KPI card — one large value with trend indicator.

**Default size:** 3 × 2

**Display modes:**
- **Single field** — large primary value, optional sub-value, trend badge (up/down arrow + change %), mini area sparkline.
- **Multi-field** — when multiple fields are selected, renders a 2–3 column grid of smaller KPI tiles.

**Configuration:**

| Setting | Description |
|---------|-------------|
| Title | Card header label |
| Value | Primary number or text (static mode) |
| Sub Value | Secondary line below the main value |
| Trend | Trend text (e.g., "+12%") |
| Trend Direction | Up (green) or Down (red) |
| Prefix / Suffix | Text prepended/appended to the value |
| Description | Small footnote text |
| Accent Color | Color swatch for the card's accent line |
| Show Sparkline | Toggle the mini area chart |
| Spark Data | Comma-separated numbers for the sparkline |
| Color Thresholds | Rules that override accent color based on value (see §9.1) |
| Query | Connect to a mock database (see §8) |

---

### 5.2 Analytics Widget

**Purpose:** Metric card with period-over-period change and area sparkline.

**Default size:** 3 × 2

**Display:** Large value + change badge (e.g., "+4.2%") + period label (e.g., "Last 30 days") + 100×48 px SVG area chart.

**Configuration:**

| Setting | Description |
|---------|-------------|
| Value | Primary metric value |
| Change Value | The delta number shown on the badge |
| Change Label | Text on the badge (e.g., "vs last month") |
| Trend Up | Whether the change is positive (green) or negative (red) |
| Accent | Accent color |
| Data Points | Comma-separated numbers for the area chart |
| Period Label | Caption below the chart |
| Color Thresholds | Override accent by value (see §9.1) |
| Query | Connect to a mock database |

---

### 5.3 Bar Chart Widget

**Purpose:** Multi-series vertical or horizontal bar chart.

**Default size:** 5 × 3

**Configuration:**

| Setting | Description |
|---------|-------------|
| Stacked | Stack series on top of each other |
| Horizontal | Rotate chart to horizontal bars |
| Show Grid Lines | Toggle background grid lines |
| Show Legend | Toggle the series legend |
| Series | Add/remove series; set label, color, and data points |
| Number Format | Value axis formatting (see §9.2) |
| Reference Lines | Horizontal target lines (see §9.3) |
| Query | Connect to a mock database |

Series colors are drawn from an 8-color palette; custom colors can be set per series.

---

### 5.4 Line Chart Widget

**Purpose:** Multi-series time-series or trend line chart.

**Default size:** 5 × 3

**Configuration:**

| Setting | Description |
|---------|-------------|
| Area Fill | Fill the area beneath each line |
| Smooth Curves | Bezier curve smoothing |
| Show Dots | Data point dot markers |
| Show Grid Lines | Toggle background grid lines |
| Show Legend | Toggle the series legend |
| Series | Add/remove series; set label, color, data points |
| Number Format | Value axis formatting (see §9.2) |
| Reference Lines | Horizontal target lines (see §9.3) |
| Query | Connect to a mock database |

---

### 5.5 Pie / Donut Chart Widget

**Purpose:** Proportion breakdown as a pie or donut chart.

**Default size:** 4 × 3

**Configuration:**

| Setting | Description |
|---------|-------------|
| Segments | Name, value, and color per slice |
| Inner Radius | 0 = solid pie; > 0 = donut hole (set as percentage) |
| Show Labels | Toggle slice labels |
| Show Legend | Toggle the legend |
| Query | Connect to a mock database (labelField + valueField) |

---

### 5.6 Table Widget

**Purpose:** Tabular data with sorting, status badges, and pagination.

**Default size:** 7 × 3

**Configuration:**

| Setting | Description |
|---------|-------------|
| Columns | Define columns: key, display label, width, optional type |
| Rows | Static row data (key-value objects) |
| Striped | Alternate row shading |
| Compact | Reduced row padding |
| Status Column | Enables status badge rendering (paid, pending, failed, active, shipped, etc.) |
| Query | Connect to a mock database with joins, filters, sort, pagination |

**Column types:**
- Default — plain text/number display
- `status` — renders a colored badge using the `STATUS_MAP` lookup
- Derived — combines multiple source fields into one display value

**Status badge colors** (built-in):

| Status | Color |
|--------|-------|
| paid / active / shipped / completed | Green |
| pending / draft / processing | Yellow/Amber |
| failed / inactive / refunded / cancelled | Red |

---

### 5.7 Progress Bars Widget

**Purpose:** Multiple labeled horizontal progress bars with percentage display.

**Default size:** 4 × 3

**Configuration:**

| Setting | Description |
|---------|-------------|
| Items | List of bars: label, current value, max value, color |
| Show Values | Show numeric value alongside the percentage |
| Animated | CSS fill animation on load |
| Color Rules | Global threshold rules overriding bar color by percentage (see §9.4) |
| Query | Optional per-item `StatQueryConfig` for dynamic values |

---

### 5.8 Note Widget

**Purpose:** Free-text annotation, label, or callout box.

**Default size:** 3 × 2

**Configuration:**

| Setting | Description |
|---------|-------------|
| Content | Multiline text (newlines preserved) |
| Font Size | Small / Medium / Large |
| Accent | Left border accent color |
| Background Color | Card fill color |

No query support — static text only.

---

### 5.9 Section Divider Widget

**Purpose:** Full-width visual separator with optional label, used to group widgets into logical sections.

**Default size:** 12 × 1 (always full width, always 1 row tall)

**Configuration:**

| Setting | Description |
|---------|-------------|
| Label | Text displayed on the divider |
| Accent Color | Color of the divider line and text |
| Show Line | Toggle the horizontal divider line |
| Text Alignment | Left / Center / Right |

No query support — static only.

---

## 6. Adding & Configuring Widgets

### 6.1 Add Widget Wizard

Opened by:
- Clicking a widget type in the sidebar palette
- The **Add Widget** toolbar button (opens at type-selection step)
- Keyboard shortcut Ctrl+1 through Ctrl+9

**Step 1 — Type Selection** (skipped when opened from palette click or keyboard shortcut):
- Grid of all 9 widget types with icon, name, and default dimensions.
- Click a type to proceed to Step 2.

**Step 2 — Configure & Preview:**
- **Title** input — sets the widget card header.
- **Config panel** — type-specific settings (see Widget Reference above).
- **Query builder** — visible for data-driven types; connect to a mock database.
- **Live preview** — a small widget preview updates in real-time as you change settings.
- **Dev Tools** (expandable) — shows the current Query JSON, raw Result JSON, and the mapped Payload JSON. Useful for debugging query configurations.
- **Add** button — places the widget at the bottom of the canvas, selects it, and scrolls it into view.

### 6.2 Edit Modal

Opened by:
- Clicking the **pencil icon** on a selected widget's header
- **Double-clicking** a widget
- Right-click → **Edit**
- Dropping a widget dragged from the sidebar (opens automatically)

The Edit modal has **3 tabs:**

**Config tab**
- Same type-specific settings as Step 2 of the wizard.
- Title input and live preview.

**Query tab**
- Full query builder for the widget's data type.
- Changes immediately update the live preview.

**Dev Tools tab**
- Query JSON — the exact query config object sent to the query engine.
- Result JSON — the raw query result before mapping.
- Payload JSON — the mapped data object passed to the widget component.
- SQL display — a human-readable SQL-like representation of the query.

**Save / Cancel:**
- **Save** — persists changes, triggers a green flash on the widget (700 ms), adds a history entry.
- **Cancel** — discards all changes.

### 6.3 Context Menu

Right-click any widget to open the context menu:

| Action | Description |
|--------|-------------|
| Edit | Opens the Edit modal for this widget |
| Duplicate | Creates a copy at the bottom of the canvas |
| Lock / Unlock | Toggle the lock state (no undo — see §11) |
| Delete | Removes the widget from the canvas |

---

## 7. Drag, Resize & Layout

### 7.1 Dragging Widgets

- **Click and hold** the widget header (or body for unlocked widgets), then drag.
- A **drag threshold of 4 px** must be exceeded before the drag engages, preventing accidental moves on clicks.
- While dragging, a **ghost outline** shows the target position and the widget snaps to the nearest grid cell.
- Widgets cannot overlap — if the target position is occupied, the dragged widget pushes other widgets down. If a **locked widget** blocks the path, the move is rejected silently.
- **Three-tier fallback** on collision:
  1. Full move to target position
  2. X-axis only
  3. Y-axis only
  4. Reject if all blocked by a locked widget

**Touch drag:** Long-press for 170 ms to enter drag mode. Moving more than 10 px before the timer fires cancels drag and lets native scroll proceed.

### 7.2 Resizing Widgets

- Hover over the **bottom-right corner** of a widget to reveal the resize handle.
- Drag to resize. Minimum size is determined by the widget type.
- During resize, colliding widgets are pushed downward. If a locked widget is in the path the resize is blocked.
- Resizing is bounded to `MAX_WIDGET_H = 20` rows.

### 7.3 Auto-Scroll

While dragging or resizing, if the pointer comes within **72 px** of the scroll container's top or bottom edge the canvas auto-scrolls. Speed scales proportionally up to a maximum of **28 px per animation frame**.

### 7.4 Alignment Guides

When dragging or resizing, dashed accent-colored guide lines appear when the moving widget's edges (left, center, right / top, center, bottom) come within **8 px** of any other widget's edges. These guides help with precise alignment.

Toggle via the **Alignment Guides** sidebar switch.

### 7.5 Pack Layout

The **Pack Layout** toolbar button (or pressing P — not a default shortcut, check the Help modal) collapses all vertical gaps:

- Iterates over all unlocked, non-pinned widgets sorted by Y position.
- Slides each widget up as far as possible without collision.
- Preserves horizontal positions.
- **Pinned widgets** are skipped and act as immovable anchors.
- Adds a history entry (undoable with Ctrl+Z).

### 7.6 Widget Nudging

With a widget selected, use the **arrow keys** to nudge it one grid unit at a time:

- ← → — move 1 column left/right
- ↑ ↓ — move 1 row up/down

If the target cell is occupied or out of bounds the nudge is silently ignored (no error). Locked widgets cannot be nudged.

---

## 8. Query System

### 8.1 Overview

The query system connects widgets to mock product databases. There is **no real backend** — all data is served from in-memory datasets in `src/app/test-cases/`.

A widget can operate in two modes:
- **Static** — data is hardcoded in the widget's config (set via the Config tab).
- **Query** — a `QueryConfig` object drives data fetching on each render (set via the Query tab).

Query execution flow:
1. Widget component calls `QueryService.execute<Type>Query(config)`.
2. `QueryService` resolves the product database, applies joins, filters, aggregations, sorts, and pagination.
3. Raw `QueryResult` is passed through `QueryResultMapper` to produce widget-ready display data.
4. Widget re-renders via Angular Signals reactivity.

### 8.2 Query Builders by Widget Type

#### Stat Query Builder
Configures a **`StatQueryConfig`**:

| Field | Description |
|-------|-------------|
| Product | EPX / Accounting / Prescriptions |
| Entity | Table/entity to query (e.g., Appointments, Invoices) |
| Field | Numeric field to aggregate |
| Aggregation | Count / Sum / Average / Min / Max |
| Filters | Optional field-level filter conditions |
| Date Range | Preset or custom date window |
| Period Label | Display caption (e.g., "This Quarter") |

#### Chart Query Builder (Bar & Line)
Configures a **`ChartQueryConfig`**:

| Field | Description |
|-------|-------------|
| Product | Database product |
| Entities | One or more entities (multi-join) |
| Group By | Field used for X-axis categories |
| Series | One series per line/bar; each with entity, field, aggregation, color |
| Filters | Filter conditions |
| Date Range | Date window |
| Query Labels | Override axis/legend labels |

#### Pie Query Builder
Configures a **`PieQueryConfig`**:

| Field | Description |
|-------|-------------|
| Product | Database product |
| Entity | Table to query |
| Label Field | Field used as slice name |
| Value Field | Numeric field for slice size |
| Aggregation | Sum / Count / Average |
| Filters | Filter conditions |

#### Table Query Builder
Configures a **`TableQueryConfig`**:

| Field | Description |
|-------|-------------|
| Product | Database product |
| Entities | One or more entities to join |
| Columns | Column picker — field + display label |
| Sort | Sort by entity and field, ascending or descending |
| Page Size | Number of rows to return |
| Filter Groups | AND/OR groups of filter conditions |

### 8.3 Filter Builder

All query builders include an optional filter builder:
- Add multiple conditions.
- Each condition: **Field**, **Operator** (equals, not equals, contains, greater than, less than, in, not in), **Value**.
- Conditions are joined with AND logic within a group; groups can be OR-combined.

### 8.4 Per-Widget Date Filter

Every data-driven widget includes a **date range picker** in its card header. Presets include:
- Today, Yesterday
- Last 7 / 30 / 90 days
- This month, Last month
- This quarter, Last quarter
- This year
- Custom range

The date filter is applied locally to the widget — it overrides the `dateRange` in the stored query config without modifying it. It does **not** affect the dashboard title or other widgets.

### 8.5 Mock Databases

Three product databases are bundled in `src/app/test-cases/`:

| Product | Entities | Sample Metrics |
|---------|----------|----------------|
| **EPX Clinical** | Appointments, Providers, Slots, Patients | Appointment counts, completion rates, provider utilization, payor breakdown |
| **Accounting** | Invoices, Payments, Line Items | Invoice totals, payment status, aging buckets, collection targets |
| **Prescriptions** | Rx records, Drugs, Dispensing | Rx volume, drug class breakdown, dispensing activity |

---

## 9. Advanced Widget Features

### 9.1 Color Thresholds

Available on: **Stat**, **Analytics**

Override the widget's accent color automatically based on the current value.

**Configuration:** Add one or more threshold rules in the Config panel:

| Field | Description |
|-------|-------------|
| Threshold | Numeric value that triggers the rule |
| Color | Color to apply when value ≥ threshold |

**Evaluation:** Rules are sorted descending by threshold. The first rule whose threshold the current value meets or exceeds is applied. If no rule matches (or the array is empty) the original `accent` color is used.

**Example:**
```
≥ 90  → green    (excellent)
≥ 70  → yellow   (warning)
≥ 0   → red      (critical)
```

### 9.2 Number Formatting

Available on: **Bar Chart**, **Line Chart**

Controls how values are displayed on the chart's value axis and in tooltips.

| Notation | Example | Description |
|----------|---------|-------------|
| `compact` | 1.2k / 3.4M | Abbreviates large numbers |
| `fixed` | 1,234.56 | Decimal notation with configurable places |
| `currency` | $1,234.56 | Currency with configurable symbol |
| `percent` | 42% | Multiplied by 100 and appended with % |

Decimal places and currency symbol are configurable per chart. When no format is set the default compact notation is used.

### 9.3 Reference Lines

Available on: **Bar Chart**, **Line Chart**

Horizontal lines drawn across the chart to mark targets, budgets, or thresholds.

**Configuration per line:**

| Field | Description |
|-------|-------------|
| Label | Text annotation on the line |
| Value | Y-axis value where the line is drawn |
| Color | Line color |
| Dashed | Whether the line is dashed (default) or solid |

Multiple reference lines can be added to a single chart. They are rendered as ApexCharts y-axis annotations.

### 9.4 Progress Color Rules

Available on: **Progress Bars**

Override bar colors globally based on the bar's fill percentage.

**Configuration per rule:**

| Field | Description |
|-------|-------------|
| Min Percent | The fill percentage that activates this rule |
| Color | Bar color when fill ≥ min percent |

**Evaluation:** Rules are sorted descending. The highest matching rule wins. Falls back to the individual item's color if no rule matches.

**Example:**
```
≥ 90% → red    (capacity warning)
≥ 60% → yellow
≥ 0%  → green
```

### 9.5 Widget Pinning

Any widget can be marked as **pinned** (`pinned: true` on the `Widget` object).

Pinned widgets:
- Are **immune to displacement** — other widgets cannot push them when resolving layout collisions.
- Are **skipped by Pack Layout** — they do not move during gap collapsing.
- **Can still be dragged manually** by the user.
- Are **distinct from locked** — a locked widget cannot be edited or moved; a pinned widget is just an immovable layout anchor.

---

## 10. Dashboard View Mode

Navigate to the `/view` route (or click **View Mode** in the toolbar) to enter read-only mode.

**Features:**
- All widgets are rendered without drag/resize handles or action buttons.
- **Live clock** — top-right corner shows current time (HH:MM) and date, updating every 60 seconds.
- **Fullscreen toggle** — expands the view to full screen.
- **Minimap** — canvas overview with scrollable viewport indicator.
- **Global filter bar** — a date/product filter applied to all query-enabled widgets simultaneously.
- **Widget type chips** — a summary strip showing the count of each widget type present (e.g., "2 Stats · 1 Bar · 1 Table").
- The same 12-column grid and zoom level as the builder are maintained.

---

## 11. Undo / Redo History

Every canvas change is recorded as a history snapshot:

| Action | Added to history? |
|--------|-----------------|
| Add widget | Yes |
| Delete widget | Yes |
| Save widget config | Yes |
| Drag widget (on release) | Yes (single entry per drag — not per frame) |
| Resize widget (on release) | Yes (single entry per resize) |
| Duplicate widget | Yes |
| Paste widget | Yes |
| Nudge widget (arrow keys) | Yes |
| Pack layout | Yes |
| **Lock / Unlock** | **No** (intentional — lock is not undoable) |
| Load template | Resets history to a single entry |
| Import layout | Resets history to a single entry |
| Load demo | Resets history to a single entry |

**Limits:**
- Maximum stack depth: **100 entries**. Older entries are discarded when this is exceeded.
- Drag/resize use a special two-phase approach: `setWidgetPositions()` updates positions without creating history entries (preventing flood), and `commitDragResize()` creates a single entry when the pointer is released.

**History Snapshot metadata:**
Each snapshot records: widget array, timestamp, action label (e.g., "Add widget", "Delete widget", "Move / resize"), and widget count — enabling a history browser UI.

**Keyboard:** Ctrl+Z (undo), Ctrl+Y or Ctrl+Shift+Z (redo).

---

## 12. Import & Export

### Export

Click **Export** in the toolbar. The current dashboard is downloaded as:
```
<dashboard-title>.json
```

Format:
```json
{
  "title": "My Dashboard",
  "rowH": 80,
  "widgets": [ /* Widget[] */ ]
}
```

### Import

Click **Import** in the toolbar, or drag a JSON file onto the Import modal:

**Supported formats:**
- **Current** — `{ title, widgets }` with optional `rowH`
- **Legacy** — raw `Widget[]` array

**What happens on import:**
1. All widget IDs are **regenerated** to prevent collisions with existing dashboards.
2. The dashboard title is set from the file.
3. The widget array replaces the current canvas.
4. Undo history is **reset** to a single entry (you cannot undo back to the pre-import state).

On failure, an error message is shown and the canvas is unchanged.

---

## 13. Pre-built Templates

Three templates are available from the **Templates** modal:

### EPX Clinical Dashboard
A clinical operations overview including:
- Appointment count (Stat)
- Revenue totals (Stat + Analytics)
- Completion rate (Analytics)
- Appointments by provider (Bar chart)
- Payor breakdown (Pie chart)
- Appointment table with status badges

### Accounting Dashboard
Financial management view including:
- Total invoices and outstanding balance (Stat)
- Payment collection rate (Analytics)
- Invoice aging buckets (Bar chart)
- Payment status distribution (Pie chart)
- Invoice table with paid/pending/failed badges
- Collection target progress bars

### Prescriptions Dashboard
Pharmacy activity overview including:
- Total Rx count (Stat)
- Active prescriptions (Analytics)
- Dispensing volume trend (Line chart)
- Drug class breakdown (Pie chart)
- Rx table with drug and dispensing data
- Progress bars by drug category

Loading any template **resets the undo history** — you cannot undo back to the previous dashboard layout after loading a template.

---

## 14. Keyboard Shortcuts

All shortcuts are blocked when the keyboard focus is on an `<input>`, `<textarea>`, or `<select>` element. Shortcuts other than Esc are also blocked while any modal is open.

### Canvas Actions

| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+Shift+Z | Redo (alternate) |
| Ctrl+C | Copy selected widget to clipboard |
| Ctrl+V | Paste clipboard widget |
| Ctrl+D | Duplicate selected widget |
| Delete | Delete selected widget |
| Backspace | Delete selected widget |
| L | Toggle lock on selected widget |
| Esc | Close all modals; deselect widget |

### Add Widget by Type

| Shortcut | Widget Type |
|----------|-------------|
| Ctrl+1 | Stat |
| Ctrl+2 | Analytics |
| Ctrl+3 | Bar Chart |
| Ctrl+4 | Line Chart |
| Ctrl+5 | Pie / Donut Chart |
| Ctrl+6 | Table |
| Ctrl+7 | Progress Bars |
| Ctrl+8 | Note |
| Ctrl+9 | Section Divider |

These shortcuts are **not affected by the sidebar search filter** — they always add the corresponding type.

### Navigation

| Shortcut | Action |
|----------|--------|
| ↑ ↓ ← → | Nudge selected widget 1 grid unit |
| Ctrl+Scroll | Zoom canvas in / out |

---

## 15. Theming

The application ships with **Dark** (default) and **Light** themes.

**Switching themes:**
- Click the theme toggle button in the toolbar (sun/moon icon).

**Persistence:** The selected theme is saved to `localStorage` under the key `dashcraft-theme` and restored on next visit.

**How it works:** The `ThemeService` sets a `data-theme="dark"` or `data-theme="light"` attribute on `document.documentElement`. All colors are CSS custom properties defined in `src/app/styles/_tokens.scss`:

| Variable | Role |
|----------|------|
| `--acc` | Primary accent color |
| `--bg1` | Deepest background |
| `--bg2` | Card background |
| `--bg3` | Elevated surface |
| `--bg4` | Input / hover surface |
| `--txt1` | Primary text |
| `--txt2` | Secondary / muted text |
| `--bdr` | Border color |
| `--font-mono` | Monospace font stack |

Components never hardcode color values — only CSS variables are used.

---

## 16. Responsive Design

**Breakpoint:** 1024 px window width.

| State | Description |
|-------|-------------|
| `compactViewport = false` | Desktop — sidebar is a permanent left column (210 px) |
| `compactViewport = true` | Tablet/narrow — sidebar collapses to a slide-in drawer |

**In compact mode:**
- Sidebar is hidden by default; a hamburger icon in the toolbar opens it as an overlay drawer.
- Toolbar actions that don't fit overflow into a "..." dropdown menu.

**Reactive sizing:** A `ResizeObserver` on the canvas container and a `window:resize` listener both call `syncResponsiveUi()` which updates the `compactViewport` signal and recomputes `canvasW` / `colW`.

Widget rendering automatically adapts as `colW` changes — no manual recalculation needed in components.

---

## 17. Developer Reference

### 17.1 Directory Structure

```
src/app/
├── components/
│   ├── canvas/                 # Builder shell — layout host, keyboard shortcuts, modal orchestration
│   ├── dashboard-view/         # Read-only view mode (clock, fullscreen, type chips)
│   ├── widget-card/
│   │   ├── widget-card.ts              # Re-export only
│   │   └── widget-card.smooth.ts       # ACTIVE impl — pointer API, RAF, auto-scroll, guides
│   ├── widgets/                # 9 widget content components
│   ├── sidebar/                # Widget palette, search, shortcuts, grid info, toggles
│   ├── toolbar/                # Title edit, zoom, undo/redo, export, import, view mode
│   ├── minimap/                # SVG canvas overview with viewport indicator
│   └── modals/
│       ├── add-widget-wizard/  # 2-step: type select → configure + preview
│       ├── edit-modal/         # Config + Query + Dev Tools tabs
│       ├── templates-modal/    # Pre-built dashboard templates
│       ├── import-modal/       # JSON drag-drop / file picker
│       ├── help-modal/         # 5-tab help reference
│       └── context-menu/       # Right-click actions
├── shared/
│   ├── config-panels/          # Per-type edit panels
│   └── query-builder/          # Per-type query builders + filter-builder
├── services/
│   ├── dashboard.service.ts    # SINGLE SOURCE OF TRUTH — all signals live here
│   ├── query.service.ts        # Mock query engine (joins, filters, aggregations, pagination)
│   └── theme.service.ts        # Dark/light toggle, persisted to localStorage
└── core/
    ├── interfaces.ts           # All TypeScript types
    ├── constants.ts            # All magic numbers
    ├── catalog.ts              # Widget type registry
    ├── factories.ts            # createWidget(type, x, y) factory
    ├── layout.utils.ts         # Pure grid math
    ├── query-types.ts          # Query system enums and interfaces
    ├── query-result-mapper.ts  # QueryResult → widget display data
    ├── data-schema.ts          # Static field pool
    └── ProductTemplates.ts     # 3 pre-built template definitions
```

### 17.2 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Angular 21.2 — standalone components, Signals, OnPush everywhere |
| Language | TypeScript 5.9 |
| Styling | SCSS with CSS custom properties |
| UI Kit | Angular Material 21.2 (dialogs) + Bootstrap 5 (utilities) |
| Charts | ApexCharts 5 via ng-apexcharts |
| State | Angular Signals exclusively — no NgRx, no BehaviorSubject |
| Reactivity | RxJS only for `fromEvent` streams (wheel, resize) |
| Build | Angular CLI + Vite |
| Tests | Vitest |
| Deploy | angular-cli-ghpages → GitHub Pages |

### 17.3 Grid Math & Layout Utils

All grid functions live in `src/app/core/layout.utils.ts`. Never call grid math inline in components.

```typescript
// Convert grid units to CSS pixel rect
gridToPixel(widget: GridPosition, colW: number): PixelRect

// Compute pixel column width from canvas width
computeColW(canvasW: number): number

// Compute canvas height from widget array
computeCanvasH(widgets: Widget[]): number

// Find next available Y position at the bottom
getNextY(widgets: Widget[]): number

// Collision detection
collides(a: GridPosition, b: GridPosition): boolean
hasCollision(widget: GridPosition, others: GridPosition[]): boolean

// Layout resolution (called on drop/drag)
resolveLayout(widgets: Widget[], maxPasses?: number): Widget[]
resolveDrag(widget, targetX, targetY, allWidgets): Widget | null
resolveResize(widget, proposed, dir, allWidgets): Widget | null

// Pack layout (collapse vertical gaps)
packLayout(widgets: Widget[]): Widget[]
```

### 17.4 Signals Architecture

All state is in `DashboardService`. Components:
- **Read** via signal expressions in templates: `svc.widgets()`, `svc.zoom()`
- **Write** only via service methods: `svc.saveWidget(w)`, `svc.deleteWidget(id)`

```typescript
// Core pattern — always updateWidgets() for mutations (pushes history automatically)
private updateWidgets(fn: (ws: Widget[]) => Widget[]): void {
  const next = fn(deepClone(this.widgets()));
  this._widgets.set(next);
  this.pushHistory(next);
}

// Exception — drag/resize use setWidgetPositions() (no history entry)
setWidgetPositions(updates: { id: string; pos: GridPosition }[]): void
// Then on pointerup:
commitDragResize(): void  // single history entry
```

**OnPush everywhere** — every component uses `ChangeDetectionStrategy.OnPush`. After imperative DOM mutations call `this.cdr.markForCheck()`.

**RxJS usage** — only for `fromEvent` streams that need teardown:
```typescript
private destroy$ = new Subject<void>();

fromEvent(el, 'scroll')
  .pipe(takeUntil(this.destroy$))
  .subscribe(/* ... */);

ngOnDestroy() { this.destroy$.next(); }
```

### 17.5 History System Internals

```typescript
interface HistorySnapshot {
  widgets: Widget[];     // deep clone of full widget array
  timestamp: number;     // Date.now()
  label: string;         // "Add widget" | "Delete widget" | "Move / resize" | etc.
  widgetCount: number;   // widgets.length for quick display
}
```

- `history` signal holds up to 100 `HistorySnapshot` entries.
- `histIdx` is the current position. Undo = `histIdx - 1`, Redo = `histIdx + 1`.
- Any new action while at `histIdx < history.length - 1` truncates the redo stack.
- `lockWidget()` updates widgets **without** calling `updateWidgets()` — lock state is intentionally non-undoable.
- `loadTemplate()`, `loadDemo()`, `importLayout()` call `resetHistory()` — replacing the entire stack with a single entry.

### 17.6 Drag System Internals

All drag/resize logic lives in `widget-card.smooth.ts`. `widget-card.ts` is a one-line re-export:
```typescript
export { WidgetCard } from './widget-card.smooth';
```

**Tuning constants:**
```typescript
DRAG_THRESHOLD_PX       = 4    // px moved before drag "engages"
TOUCH_DRAG_HOLD_MS      = 170  // ms long-press before touch drag starts
TOUCH_SCROLL_CANCEL_PX  = 10   // px moved before touch becomes scroll (not drag)
AUTO_SCROLL_EDGE_PX     = 72   // px from viewport edge to trigger auto-scroll
AUTO_SCROLL_MAX_STEP_PX = 28   // max px scrolled per animation frame
ALIGNMENT_THRESHOLD_PX  = 8    // px proximity to trigger alignment guide
```

**Pointer event flow:**
```
pointerdown
  └─ mouse: set engaged=false, start tracking movement
  └─ touch: start 170ms timer
       └─ if finger moves >10px before timer: cancelPendingTouchDrag (native scroll)
       └─ timer fires: engaged=true

pointermove (when engaged=true)
  └─ RAF loop: applyDragPreview()
       ├─ compute target grid cell
       ├─ call resolveDrag() or resolveResize()
       ├─ call setWidgetPositions() (no history)
       ├─ emit alignment guides
       └─ check auto-scroll edges

pointerup
  └─ if layout changed: commitDragResize() (single history entry)
  └─ cleanup drag state
```

### 17.7 Adding a New Widget Type

1. Add to `WidgetType` enum in `core/interfaces.ts`
2. Define config interface in `core/interfaces.ts`; add to `WidgetConfig` union
3. Add catalog entry in `core/catalog.ts` (icon, color, defaultSize)
4. Add factory function in `core/factories.ts` and register in `FACTORIES` map
5. Create `<type>-widget.ts` in `components/widgets/`
6. Add `@case` to widget-card template switch statement; import component
7. Create config panel in `shared/config-panels/edit-<type>-config.ts`
8. Create query builder in `shared/query-builder/<type>-query-builder.ts` (if data-driven)
9. Add case to `data-schema.ts` `applyFieldSelection()` (if using static field selection)
10. Update the `QueryResultMapper` if a new query config type is needed

### 17.8 Audit Comment Tags

Bug fixes are tagged with sequential IDs in code comments, e.g. `// C10 fix: lock not undoable`.

| Series | Domain |
|--------|--------|
| **A** | Angular-specific fixes (vs. React source) |
| **B** | Data / schema bugs |
| **C** | UI / interaction bugs |
| **E** | Enhancement features |
| **M** | Modal / layout edge cases |

When fixing a bug: add `// Xnn fix: short description` at the fix site and at any related guard.

### 17.9 Key Constants

Defined in `src/app/core/constants.ts`:

```typescript
// Grid
COLS = 12
DEFAULT_ROW_H = 80
ALLOWED_ROW_HEIGHTS = [60, 80, 100, 120]
GAP = 10
HDR_H = 40
SIDEBAR_W = 210
TOOLBAR_H = 52
MIN_CANVAS_W = 600
MAX_WIDGET_H = 20
MAX_LAYOUT_PASSES = 60

// History
MAX_HISTORY_ENTRIES = 100
SAVE_ANIMATION_MS = 700        // green flash duration

// Zoom
ZOOM_MIN = 0.4
ZOOM_MAX = 1.5
ZOOM_STEP = 0.1

// Minimap
MINIMAP_W = 160

// View mode
CLOCK_INTERVAL_MS = 60000      // live clock update frequency

// Helpers
uid()                          // 7-char random ID
clamp(val, min, max)
deepClone(obj)                 // JSON.parse(JSON.stringify(obj))
toFilename(title)              // spaces → hyphens for export filename
initialCanvasW()               // safe canvas width (accounts for SSR)
```

---

*This document covers all features, configurations, and workflows of DynamicDashboardBuilder (DASHCRAFT) as of Angular 21.2. For implementation questions, see `CLAUDE.md`.*
