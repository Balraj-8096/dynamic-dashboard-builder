/**
 * mock-dashboards.ts
 *
 * Sample dashboard registry data for testing the multi-dashboard feature
 * (DashboardListPage, DashboardRegistryService, DashboardPersistenceService).
 *
 * MOCK_DASHBOARD_SUMMARIES — used by DashboardListPage and DashboardRegistryService
 *   when useRealApi() = false. Matches the DashboardSummary interface from
 *   dashboard-api.service.ts: { id, title, updatedAt? }
 *
 * MOCK_DASHBOARD_PAYLOADS — used by DashboardPersistenceService.load(id) in mock mode.
 *   Matches the DashboardPayload interface: { id, title, widgets, updatedAt? }
 *   Widget configs use the current interfaces from core/interfaces.ts and query-types.ts.
 *   All queryConfig objects use StatQueryConfig / ChartQueryConfig / PieQueryConfig /
 *   TableQueryConfig shapes — NOT the old { entity, field, aggregation, dateRange } shape.
 *
 * EDGE CASES COVERED:
 *   - 6 dashboards: tests grid layout and pagination/scroll at reasonable volume
 *   - One dashboard with a very long title (UI truncation)
 *   - One dashboard with zero widgets (empty canvas state)
 *   - One dashboard with no updatedAt (optional field — show "Never saved" fallback)
 *   - One dashboard that is the "active" dashboard (currently open in builder)
 *   - Mixed updatedAt recency: today, last week, last month, 6 months ago
 */

// ─── Types (mirrors dashboard-api.service.ts, duplicated to avoid circular imports) ───

export interface MockDashboardSummary {
  id:         string;
  title:      string;
  updatedAt?: string;   // ISO 8601 — optional, matches DashboardSummary
}

export interface MockDashboardPayload {
  id:         string;
  title:      string;
  widgets:    unknown[];  // Widget[] — typed as unknown[] to avoid importing Widget here
  updatedAt?: string;
}

// ─── Dashboard List (DashboardSummary[]) ─────────────────────────────────────────────

export const MOCK_DASHBOARD_SUMMARIES: MockDashboardSummary[] = [
  {
    id:        "dash-001",
    title:     "EPX Clinical Dashboard",
    updatedAt: "2026-03-31T14:22:00"    // yesterday — most recently edited
  },
  {
    id:        "dash-002",
    title:     "Accounting Overview Q1 2026",
    updatedAt: "2026-03-28T09:15:00"    // 3 days ago
  },
  {
    id:        "dash-003",
    title:     "Prescriptions Monitor",
    updatedAt: "2026-03-20T16:45:00"    // ~10 days ago
  },
  {
    id:        "dash-004",
    title:     "Executive Summary — All Products — Board Pack March 2026",  // long title: tests truncation
    updatedAt: "2026-03-01T11:00:00"    // 1 month ago
  },
  {
    id:        "dash-005",
    title:     "Empty Dashboard",
    updatedAt: "2025-10-05T08:30:00"    // 6 months ago — stale
  },
  {
    id:        "dash-006",
    title:     "New Dashboard",
    updatedAt: undefined                 // no updatedAt — tests "Never saved" fallback
  }
];

// ─── Dashboard Payloads (DashboardPayload) ────────────────────────────────────────────
// All widget configs match the current interfaces in core/interfaces.ts exactly.
// queryConfig uses the proper StatQueryConfig / ChartQueryConfig / PieQueryConfig /
// TableQueryConfig shapes from core/query-types.ts.

export const MOCK_DASHBOARD_PAYLOADS: Record<string, MockDashboardPayload> = {

  // ─── EPX Clinical Dashboard ───────────────────────────────────────────────────
  "dash-001": {
    id:        "dash-001",
    title:     "EPX Clinical Dashboard",
    updatedAt: "2026-03-31T14:22:00",
    widgets: [
      // Row 0: 4 KPI stats ────────────────────────────────────────────────────
      {
        id: "w-epx-001", type: "stat", title: "Total Appointments", locked: false,
        x: 0, y: 0, w: 3, h: 2,
        config: {
          value: "–", subValue: "all time", trend: "", trendUp: true,
          accent: "#3b82f6", prefix: "", suffix: "",
          description: "Total appointment records in the system",
          showSparkline: false, sparkData: [],
          queryConfig: {
            product: "epx",
            entities: ["appointment", "appointment_patient"],
            agg: { entity: "appointment_patient", field: "appointment_id", function: "COUNT" },
          },
        },
      },
      {
        id: "w-epx-002", type: "stat", title: "Total Revenue", locked: false,
        x: 3, y: 0, w: 3, h: 2,
        config: {
          value: "–", subValue: "from appointments", trend: "", trendUp: true,
          accent: "#10b981", prefix: "£", suffix: "",
          description: "Sum of appointment prices",
          showSparkline: false, sparkData: [],
          queryConfig: {
            product: "epx",
            entities: ["appointment_patient"],
            agg: { entity: "appointment_patient", field: "price", function: "SUM" },
          },
        },
      },
      {
        id: "w-epx-005", type: "analytics", title: "Completed Appointments", locked: false,
        x: 6, y: 0, w: 3, h: 2,
        config: {
          value: "–", changeValue: "", changeLabel: "status: completed",
          trendUp: true, accent: "#6366f1",
          data: [], period: "All time",
          queryConfig: {
            product: "epx",
            entities: ["appointment", "appointment_patient"],
            agg: { entity: "appointment_patient", field: "appointment_id", function: "COUNT" },
            filters: [{ entity: "appointment", field: "status", operator: "eq", value: "completed" }],
          },
        },
      },
      {
        id: "w-epx-006", type: "stat", title: "Total Patients", locked: false,
        x: 9, y: 0, w: 3, h: 2,
        config: {
          value: "–", subValue: "registered", trend: "", trendUp: true,
          accent: "#a78bfa", prefix: "", suffix: "",
          description: "Unique patients registered in the system",
          showSparkline: false, sparkData: [],
          queryConfig: {
            product: "epx",
            entities: ["patient"],
            agg: { entity: "patient", field: "id", function: "COUNT" },
          },
        },
      },

      // Row 2–4: Charts ──────────────────────────────────────────────────────
      {
        id: "w-epx-003", type: "bar", title: "Appointments by Type", locked: false,
        x: 0, y: 2, w: 5, h: 3,
        config: {
          accent: "#3b82f6", stacked: false, horizontal: false,
          showGrid: true, showLegend: false, series: [],
          queryConfig: {
            product: "epx",
            entities: ["appointment"],
            groupBy: { entity: "appointment", field: "appointmenttype" },
            valueAgg: { entity: "appointment", field: "id", function: "COUNT" },
          },
        },
      },
      {
        id: "w-epx-007", type: "line", title: "Appointments Trend", locked: false,
        x: 5, y: 2, w: 7, h: 3,
        config: {
          areaFill: true, smooth: true, showGrid: true,
          showDots: false, showLegend: false, series: [],
          queryConfig: {
            product: "epx",
            entities: ["appointment"],
            groupBy: { entity: "appointment", field: "appointmentdate" },
            valueAgg: { entity: "appointment", field: "id", function: "COUNT" },
          },
        },
      },

      // Row 5: Section divider ───────────────────────────────────────────────
      {
        id: "w-epx-004", type: "section", title: "Section", locked: false,
        x: 0, y: 5, w: 12, h: 1,
        config: { label: "Patient Overview", accent: "#6366f1", showLine: true, align: "left" },
      },

      // Row 6–9: Patient breakdown ───────────────────────────────────────────
      {
        id: "w-epx-008", type: "pie", title: "Payor Breakdown", locked: false,
        x: 0, y: 6, w: 4, h: 3,
        config: {
          data: [], innerRadius: 55, showLabels: false, showLegend: true,
          queryConfig: {
            product: "epx",
            entities: ["appointment_patient"],
            groupBy: { entity: "appointment_patient", field: "payortype" },
            valueAgg: { entity: "appointment_patient", field: "appointment_id", function: "COUNT" },
          },
        },
      },
      {
        id: "w-epx-009", type: "table", title: "Recent Appointments", locked: false,
        x: 4, y: 6, w: 8, h: 4,
        config: {
          columns: [], rows: [], striped: true, compact: false, statusColumn: false,
          queryConfig: {
            product: "epx",
            entities: ["appointment", "appointment_patient"],
            columns: [
              { entity: "appointment", field: "appointmentdate" },
              { entity: "appointment", field: "appointmenttype" },
              { entity: "appointment", field: "status" },
              { entity: "appointment", field: "provider" },
            ],
            sort: { entity: "appointment", field: "appointmentdate", direction: "desc" },
            pageSize: 10,
          },
        },
      },
      {
        id: "w-epx-010", type: "progress", title: "Slot Utilisation", locked: false,
        x: 0, y: 9, w: 4, h: 3,
        config: {
          showValues: true, animated: true,
          items: [
            { label: "Morning Slots",   value: 74, max: 100, color: "#6366f1" },
            { label: "Afternoon Slots", value: 58, max: 100, color: "#3b82f6" },
            { label: "Evening Slots",   value: 32, max: 100, color: "#a78bfa" },
          ],
        },
      },
    ],
  },

  // ─── Accounting Overview Q1 2026 ─────────────────────────────────────────────
  "dash-002": {
    id:        "dash-002",
    title:     "Accounting Overview Q1 2026",
    updatedAt: "2026-03-28T09:15:00",
    widgets: [
      // Row 0: 4 KPI stats ────────────────────────────────────────────────────
      {
        id: "w-acc-001", type: "stat", title: "Total Invoiced", locked: false,
        x: 0, y: 0, w: 3, h: 2,
        config: {
          value: "–", subValue: "non-void invoices", trend: "", trendUp: true,
          accent: "#3b82f6", prefix: "£", suffix: "",
          description: "Sum of all non-void invoice amounts",
          showSparkline: false, sparkData: [],
          queryConfig: {
            product: "accounting",
            entities: ["invoice"],
            agg: { entity: "invoice", field: "totalamount", function: "SUM" },
            filters: [{ entity: "invoice", field: "isvoid", operator: "eq", value: false }],
          },
        },
      },
      {
        id: "w-acc-002", type: "stat", title: "Overdue Invoices", locked: false,
        x: 3, y: 0, w: 3, h: 2,
        config: {
          value: "–", subValue: "requiring action", trend: "", trendUp: false,
          accent: "#ef4444", prefix: "", suffix: "",
          description: "Count of invoices with status = overdue",
          showSparkline: false, sparkData: [],
          queryConfig: {
            product: "accounting",
            entities: ["invoice"],
            agg: { entity: "invoice", field: "id", function: "COUNT" },
            filters: [{ entity: "invoice", field: "status", operator: "eq", value: "overdue" }],
          },
        },
      },
      {
        id: "w-acc-003", type: "pie", title: "Revenue by Invoice Type", locked: false,
        x: 6, y: 0, w: 4, h: 3,
        config: {
          data: [], innerRadius: 55, showLabels: false, showLegend: true,
          queryConfig: {
            product: "accounting",
            entities: ["invoice"],
            groupBy: { entity: "invoice", field: "invoicetype" },
            valueAgg: { entity: "invoice", field: "totalamount", function: "SUM" },
            filters: [{ entity: "invoice", field: "isvoid", operator: "eq", value: false }],
          },
        },
      },
      {
        id: "w-acc-007", type: "analytics", title: "Payments Received", locked: false,
        x: 10, y: 0, w: 2, h: 2,
        config: {
          value: "–", changeValue: "", changeLabel: "total payments",
          trendUp: true, accent: "#10b981",
          data: [], period: "All time",
          queryConfig: {
            product: "accounting",
            entities: ["payment"],
            agg: { entity: "payment", field: "amount", function: "SUM" },
          },
        },
      },

      // Row 2–3: Notes + bar chart ────────────────────────────────────────────
      {
        id: "w-acc-004", type: "note", title: "Currency Note", locked: true,
        x: 0, y: 2, w: 3, h: 2,
        config: {
          content: "All figures in GBP only. Filter by currencycode = 'GBP' before aggregating to avoid mixed-currency totals.",
          accent: "#f59e0b", fontSize: "13", bgColor: "",
        },
      },
      {
        id: "w-acc-005", type: "bar", title: "Invoices by Status", locked: false,
        x: 3, y: 2, w: 7, h: 3,
        config: {
          accent: "#3b82f6", stacked: false, horizontal: false,
          showGrid: true, showLegend: false, series: [],
          queryConfig: {
            product: "accounting",
            entities: ["invoice"],
            groupBy: { entity: "invoice", field: "status" },
            valueAgg: { entity: "invoice", field: "id", function: "COUNT" },
            filters: [{ entity: "invoice", field: "isvoid", operator: "eq", value: false }],
          },
        },
      },

      // Row 5–7: Line + progress ──────────────────────────────────────────────
      {
        id: "w-acc-008", type: "line", title: "Revenue Trend (GBP)", locked: false,
        x: 0, y: 5, w: 7, h: 3,
        config: {
          areaFill: true, smooth: true, showGrid: true,
          showDots: false, showLegend: false, series: [],
          queryConfig: {
            product: "accounting",
            entities: ["invoice"],
            groupBy: { entity: "invoice", field: "invoicedate" },
            valueAgg: { entity: "invoice", field: "totalamount", function: "SUM" },
            filters: [
              { entity: "invoice", field: "isvoid", operator: "eq", value: false },
              { entity: "invoice", field: "currencycode", operator: "eq", value: "GBP" },
            ],
          },
        },
      },
      {
        id: "w-acc-009", type: "progress", title: "Q1 Collection Targets", locked: false,
        x: 7, y: 5, w: 5, h: 3,
        config: {
          showValues: true, animated: true,
          items: [
            { label: "Revenue Target",    value: 82, max: 100, color: "#10b981" },
            { label: "Invoice Clearance", value: 67, max: 100, color: "#3b82f6" },
            { label: "Overdue Recovery",  value: 45, max: 100, color: "#f59e0b" },
          ],
        },
      },

      // Row 8–11: Table ───────────────────────────────────────────────────────
      {
        id: "w-acc-006", type: "table", title: "Invoice Ledger", locked: false,
        x: 0, y: 8, w: 12, h: 4,
        config: {
          columns: [], rows: [], striped: true, compact: true, statusColumn: false,
          queryConfig: {
            product: "accounting",
            entities: ["invoice"],
            columns: [
              { entity: "invoice", field: "invoicenumber" },
              { entity: "invoice", field: "invoicedate" },
              { entity: "invoice", field: "invoicetype" },
              { entity: "invoice", field: "totalamount" },
              { entity: "invoice", field: "status" },
            ],
            sort: { entity: "invoice", field: "invoicedate", direction: "desc" },
            pageSize: 10,
          },
        },
      },
    ],
  },

  // ─── Prescriptions Monitor ───────────────────────────────────────────────────
  "dash-003": {
    id:        "dash-003",
    title:     "Prescriptions Monitor",
    updatedAt: "2026-03-20T16:45:00",
    widgets: [
      // Row 0: KPI stats + analytics ─────────────────────────────────────────
      {
        id: "w-rx-001", type: "stat", title: "Active Prescriptions", locked: false,
        x: 0, y: 0, w: 3, h: 2,
        config: {
          value: "–", subValue: "currently active", trend: "", trendUp: true,
          accent: "#3b82f6", prefix: "", suffix: "",
          description: "Prescriptions with status = active",
          showSparkline: false, sparkData: [],
          queryConfig: {
            product: "prescriptions",
            entities: ["prescription"],
            agg: { entity: "prescription", field: "id", function: "COUNT" },
            filters: [{ entity: "prescription", field: "status", operator: "eq", value: "active" }],
          },
        },
      },
      {
        id: "w-rx-002", type: "stat", title: "Controlled Substances", locked: false,
        x: 3, y: 0, w: 3, h: 2,
        config: {
          value: "–", subValue: "controlled Rx", trend: "", trendUp: false,
          accent: "#ef4444", prefix: "", suffix: "",
          description: "Prescriptions flagged as controlled substances",
          showSparkline: false, sparkData: [],
          queryConfig: {
            product: "prescriptions",
            entities: ["prescription", "medication"],
            agg: { entity: "prescription", field: "id", function: "COUNT" },
            filters: [{ entity: "medication", field: "iscontrolled", operator: "eq", value: true }],
          },
        },
      },
      {
        id: "w-rx-003", type: "progress", title: "Dispensing Rates", locked: false,
        x: 6, y: 0, w: 4, h: 3,
        config: {
          showValues: true, animated: true,
          items: [
            { label: "Dispensed",    value: 80, max: 100, color: "#10b981" },
            { label: "Pending",      value: 14, max: 100, color: "#f59e0b" },
            { label: "Rejected",     value: 6,  max: 100, color: "#ef4444" },
          ],
        },
      },
      {
        id: "w-rx-007", type: "analytics", title: "Total Dispensed", locked: false,
        x: 10, y: 0, w: 2, h: 2,
        config: {
          value: "–", changeValue: "", changeLabel: "dispensed",
          trendUp: true, accent: "#10b981",
          data: [], period: "All time",
          queryConfig: {
            product: "prescriptions",
            entities: ["dispense"],
            agg: { entity: "dispense", field: "id", function: "COUNT" },
            filters: [{ entity: "dispense", field: "status", operator: "eq", value: "dispensed" }],
          },
        },
      },

      // Row 3: Section divider ───────────────────────────────────────────────
      {
        id: "w-rx-008", type: "section", title: "Section", locked: false,
        x: 0, y: 3, w: 12, h: 1,
        config: { label: "Drug Analysis", accent: "#f59e0b", showLine: true, align: "left" },
      },

      // Row 4–6: Charts ──────────────────────────────────────────────────────
      {
        id: "w-rx-004", type: "pie", title: "Prescriptions by Drug Class", locked: false,
        x: 0, y: 4, w: 4, h: 3,
        config: {
          data: [], innerRadius: 55, showLabels: false, showLegend: true,
          queryConfig: {
            product: "prescriptions",
            entities: ["prescription", "medication"],
            groupBy: { entity: "medication", field: "drugclass" },
            valueAgg: { entity: "prescription", field: "id", function: "COUNT" },
          },
        },
      },
      {
        id: "w-rx-005", type: "bar", title: "Top Prescribed Drugs", locked: false,
        x: 4, y: 4, w: 8, h: 3,
        config: {
          accent: "#f59e0b", stacked: false, horizontal: true,
          showGrid: true, showLegend: false, series: [],
          queryConfig: {
            product: "prescriptions",
            entities: ["prescription", "medication"],
            groupBy: { entity: "medication", field: "drugname" },
            valueAgg: { entity: "prescription", field: "id", function: "COUNT" },
          },
        },
      },

      // Row 7–10: Table ──────────────────────────────────────────────────────
      {
        id: "w-rx-006", type: "table", title: "Recent Prescriptions", locked: false,
        x: 0, y: 7, w: 12, h: 4,
        config: {
          columns: [], rows: [], striped: true, compact: false, statusColumn: false,
          queryConfig: {
            product: "prescriptions",
            entities: ["prescription", "medication"],
            columns: [
              { entity: "prescription", field: "prescriptiondate" },
              { entity: "prescription", field: "status" },
              { entity: "medication",   field: "drugname" },
              { entity: "medication",   field: "drugclass" },
              { entity: "medication",   field: "iscontrolled" },
            ],
            sort: { entity: "prescription", field: "prescriptiondate", direction: "desc" },
            pageSize: 10,
          },
        },
      },
    ],
  },

  // ─── Executive Summary — All Products ────────────────────────────────────────
  "dash-004": {
    id:        "dash-004",
    title:     "Executive Summary — All Products — Board Pack March 2026",
    updatedAt: "2026-03-01T11:00:00",
    widgets: [
      // ── Clinical section ────────────────────────────────────────────────────
      {
        id: "w-exec-001", type: "section", title: "Section", locked: false,
        x: 0, y: 0, w: 12, h: 1,
        config: { label: "Clinical — EPX", accent: "#6366f1", showLine: true, align: "left" },
      },
      {
        id: "w-exec-002", type: "stat", title: "Total Appointments YTD", locked: false,
        x: 0, y: 1, w: 3, h: 2,
        config: {
          value: "–", subValue: "year to date", trend: "", trendUp: true,
          accent: "#6366f1", prefix: "", suffix: "",
          description: "All appointments recorded this year",
          showSparkline: false, sparkData: [],
          queryConfig: {
            product: "epx",
            entities: ["appointment", "appointment_patient"],
            agg: { entity: "appointment_patient", field: "appointment_id", function: "COUNT" },
          },
        },
      },
      {
        id: "w-exec-009", type: "analytics", title: "Completed YTD", locked: false,
        x: 3, y: 1, w: 3, h: 2,
        config: {
          value: "–", changeValue: "", changeLabel: "completed",
          trendUp: true, accent: "#6366f1",
          data: [], period: "YTD",
          queryConfig: {
            product: "epx",
            entities: ["appointment", "appointment_patient"],
            agg: { entity: "appointment_patient", field: "appointment_id", function: "COUNT" },
            filters: [{ entity: "appointment", field: "status", operator: "eq", value: "completed" }],
          },
        },
      },
      {
        id: "w-exec-010", type: "bar", title: "Appointments by Type YTD", locked: false,
        x: 6, y: 1, w: 6, h: 3,
        config: {
          accent: "#6366f1", stacked: false, horizontal: false,
          showGrid: true, showLegend: false, series: [],
          queryConfig: {
            product: "epx",
            entities: ["appointment"],
            groupBy: { entity: "appointment", field: "appointmenttype" },
            valueAgg: { entity: "appointment", field: "id", function: "COUNT" },
          },
        },
      },

      // ── Finance section ─────────────────────────────────────────────────────
      {
        id: "w-exec-003", type: "section", title: "Section", locked: false,
        x: 0, y: 4, w: 12, h: 1,
        config: { label: "Finance — Accounting", accent: "#10b981", showLine: true, align: "left" },
      },
      {
        id: "w-exec-004", type: "stat", title: "Revenue YTD", locked: false,
        x: 0, y: 5, w: 3, h: 2,
        config: {
          value: "–", subValue: "year to date (GBP)", trend: "", trendUp: true,
          accent: "#10b981", prefix: "£", suffix: "",
          description: "Total GBP invoice revenue this year",
          showSparkline: false, sparkData: [],
          queryConfig: {
            product: "accounting",
            entities: ["invoice"],
            agg: { entity: "invoice", field: "totalamount", function: "SUM" },
            filters: [
              { entity: "invoice", field: "isvoid", operator: "eq", value: false },
              { entity: "invoice", field: "currencycode", operator: "eq", value: "GBP" },
            ],
          },
        },
      },
      {
        id: "w-exec-011", type: "analytics", title: "Overdue Invoices", locked: false,
        x: 3, y: 5, w: 3, h: 2,
        config: {
          value: "–", changeValue: "", changeLabel: "overdue",
          trendUp: false, accent: "#ef4444",
          data: [], period: "Current",
          queryConfig: {
            product: "accounting",
            entities: ["invoice"],
            agg: { entity: "invoice", field: "id", function: "COUNT" },
            filters: [{ entity: "invoice", field: "status", operator: "eq", value: "overdue" }],
          },
        },
      },
      {
        id: "w-exec-012", type: "pie", title: "Revenue by Invoice Type", locked: false,
        x: 6, y: 5, w: 6, h: 3,
        config: {
          data: [], innerRadius: 55, showLabels: false, showLegend: true,
          queryConfig: {
            product: "accounting",
            entities: ["invoice"],
            groupBy: { entity: "invoice", field: "invoicetype" },
            valueAgg: { entity: "invoice", field: "totalamount", function: "SUM" },
            filters: [{ entity: "invoice", field: "isvoid", operator: "eq", value: false }],
          },
        },
      },

      // ── Pharmacy section ────────────────────────────────────────────────────
      {
        id: "w-exec-005", type: "section", title: "Section", locked: false,
        x: 0, y: 8, w: 12, h: 1,
        config: { label: "Pharmacy — Prescriptions", accent: "#f59e0b", showLine: true, align: "left" },
      },
      {
        id: "w-exec-006", type: "stat", title: "Prescriptions Dispensed YTD", locked: false,
        x: 0, y: 9, w: 3, h: 2,
        config: {
          value: "–", subValue: "dispensed", trend: "", trendUp: true,
          accent: "#f59e0b", prefix: "", suffix: "",
          description: "Total dispense records with status = dispensed",
          showSparkline: false, sparkData: [],
          queryConfig: {
            product: "prescriptions",
            entities: ["dispense"],
            agg: { entity: "dispense", field: "id", function: "COUNT" },
            filters: [{ entity: "dispense", field: "status", operator: "eq", value: "dispensed" }],
          },
        },
      },
      {
        id: "w-exec-013", type: "analytics", title: "Controlled Rx", locked: false,
        x: 3, y: 9, w: 3, h: 2,
        config: {
          value: "–", changeValue: "", changeLabel: "controlled",
          trendUp: false, accent: "#ef4444",
          data: [], period: "All time",
          queryConfig: {
            product: "prescriptions",
            entities: ["prescription", "medication"],
            agg: { entity: "prescription", field: "id", function: "COUNT" },
            filters: [{ entity: "medication", field: "iscontrolled", operator: "eq", value: true }],
          },
        },
      },
      {
        id: "w-exec-014", type: "bar", title: "Dispensing by Drug Class", locked: false,
        x: 6, y: 9, w: 6, h: 3,
        config: {
          accent: "#f59e0b", stacked: false, horizontal: false,
          showGrid: true, showLegend: false, series: [],
          queryConfig: {
            product: "prescriptions",
            entities: ["prescription", "medication"],
            groupBy: { entity: "medication", field: "drugclass" },
            valueAgg: { entity: "prescription", field: "id", function: "COUNT" },
          },
        },
      },
    ],
  },

  // ─── Empty Dashboard ──────────────────────────────────────────────────────────
  "dash-005": {
    id:        "dash-005",
    title:     "Empty Dashboard",
    updatedAt: "2025-10-05T08:30:00",
    widgets: [],   // intentionally empty — tests empty canvas state in builder
  },

  // ─── New Dashboard ────────────────────────────────────────────────────────────
  "dash-006": {
    id:        "dash-006",
    title:     "New Dashboard",
    updatedAt: undefined,
    // no updatedAt — tests "Never saved" fallback in list UI
    widgets: [
      {
        id: "w-new-001", type: "note", title: "Welcome", locked: false,
        x: 0, y: 0, w: 5, h: 2,
        config: {
          content: "This is a new dashboard. Drag widgets from the sidebar to get started.",
          accent: "#6366f1", fontSize: "13", bgColor: "",
        },
      },
      {
        id: "w-new-002", type: "stat", title: "Placeholder Stat", locked: false,
        x: 5, y: 0, w: 3, h: 2,
        config: {
          value: "–", subValue: "configure me", trend: "", trendUp: true,
          accent: "#94a3b8", prefix: "", suffix: "",
          description: "Click to configure this metric",
          showSparkline: false, sparkData: [],
        },
      },
    ],
  },

};

// ─── Active Dashboard ID ──────────────────────────────────────────────────────────────
// The dashboard that should be pre-loaded when navigating to /builder in mock mode.
// In the real app this is tracked by DashboardRegistryService.activeDashboardId.

export const MOCK_ACTIVE_DASHBOARD_ID = "dash-001";

// ─── Edge Case Index ──────────────────────────────────────────────────────────────────

export const _mock_dashboard_edge_cases = {
  "EC-DASH_LONG_TITLE":    "dash-004 has a 60+ character title — tests truncation in list cards and toolbar breadcrumb",
  "EC-DASH_EMPTY_WIDGETS": "dash-005 has zero widgets — tests empty canvas rendering and '0 widgets' label in list card",
  "EC-DASH_NO_UPDATED_AT": "dash-006 has updatedAt=undefined — list UI must show a 'Never saved' or '—' fallback instead of crashing",
  "EC-DASH_STALE":         "dash-005 was last updated 2025-10-05 (~6 months ago) — tests date formatting for old timestamps",
  "EC-DASH_RECENT":        "dash-001 was last updated 2026-03-31 — tests 'yesterday' / relative-time formatting",
  "EC-DASH_MULTI_PRODUCT": "dash-004 queries all 3 products in a single dashboard — the widget queryConfig objects reference different product slugs",
  "EC-DASH_LOCKED_WIDGET": "dash-002/w-acc-004 (Currency Note) has locked=true — verify lock badge renders correctly",
  "EC-DASH_ACTIVE":        "MOCK_ACTIVE_DASHBOARD_ID='dash-001' — DashboardRegistryService should highlight this in the list and pre-load it for /builder"
} as const;
