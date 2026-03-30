---
description: DASHCRAFT developer toolkit — shows all available workflows and how to use them
---

You are helping a developer working on DASHCRAFT. Show the following toolkit menu,
then ask which workflow they want to run:

---

## DASHCRAFT Developer Skills

### Widget System
- **Add widget type**     → Walk the 10-step checklist for a new widget type
- **Widget map**          → Show all 9 widget types with sizes, configs, shortcuts
- **Config audit**        → Check a widget's config interface against its factory

### Query System
- **Check emit()**        → Scan all query builders for missing this.emit() calls
- **Query trace**         → Trace how a query config flows from builder → service → widget
- **Mock data explore**   → Browse EPX / Accounting / Prescriptions schema

### State & History
- **Debug signal**        → Trace a named signal: who sets it, what depends on it, what reads it
- **Audit tag**           → Explain what a fix tag (A1, B4, C11…) prevents and what breaks without it
- **History flow**        → Show the full push/skip/reset rules for a given operation

### Layout & Interaction
- **Layout guard**        → Scan components for inline grid math that should be in layout.utils.ts
- **Drag trace**          → Explain the full pointer → RAF → commit flow for drag or resize
- **Constants check**     → Find any hardcoded pixel values that should be in constants.ts

### Templates & Import/Export
- **New template**        → Guide to adding a pre-built template to ProductTemplates.ts
- **Import/export trace** → Explain the full JSON format and ID regeneration flow (C19)

---

Which workflow do you need?
