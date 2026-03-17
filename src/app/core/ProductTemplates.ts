// ═══════════════════════════════════════════════════════════════
//  DASHCRAFT — Product Dashboard Templates
//
//  Three templates pre-wired with live queryConfig objects:
//  ├── EPX Clinical  — appointments, patients, payor breakdown
//  ├── Accounting    — invoices, revenue, payments, claims
//  └── Prescriptions — Rx activity, drug classes, dispensing
//
//  Every stat/chart/table widget uses a real queryConfig so the
//  Dev Tools panel shows live results immediately on open.
// ═══════════════════════════════════════════════════════════════

import { DashboardTemplate, Widget, WidgetType, TextAlign } from './interfaces';
import { FACTORIES }                                        from './factories';
import {
  AggregationFunction, DateInterval, SortDirection, FilterOperator,
} from './query-types';


// ───────────────────────────────────────────────────────────────
//  EPX CLINICAL
// ───────────────────────────────────────────────────────────────

function buildEpx(): Widget[] {
  return [
    // ── Section header ─────────────────────────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 0),
      title: 'Section',
      config: { label: 'EPX Clinical Dashboard', accent: '#3b82f6', showLine: true, align: TextAlign.Left },
    },

    // ── Row 1 — 4 stat cards ───────────────────────────────────
    {
      ...FACTORIES[WidgetType.Stat](0, 1),
      title: 'Total Appointments',
      config: {
        value: '–', subValue: 'all time', trend: '', trendUp: true,
        accent: '#3b82f6', prefix: '', suffix: '',
        description: 'Total appointments recorded', showSparkline: false, sparkData: [],
        selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          periodLabel: 'All time',
        },
      },
    },
    {
      ...FACTORIES[WidgetType.Stat](3, 1),
      title: 'Completed',
      config: {
        value: '–', subValue: 'appointments', trend: '', trendUp: true,
        accent: '#10b981', prefix: '', suffix: '',
        description: 'Appointments with status = completed', showSparkline: false, sparkData: [],
        selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filters: [{ entity: 'appointment', field: 'status', operator: FilterOperator.Eq, value: 'completed' }],
          periodLabel: 'All time',
        },
      },
    },
    {
      ...FACTORIES[WidgetType.Stat](6, 1),
      title: 'No Shows',
      config: {
        value: '–', subValue: 'appointments', trend: '', trendUp: false,
        accent: '#ef4444', prefix: '', suffix: '',
        description: 'Appointments with status = no_show', showSparkline: false, sparkData: [],
        selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filters: [{ entity: 'appointment', field: 'status', operator: FilterOperator.Eq, value: 'no_show' }],
          periodLabel: 'All time',
        },
      },
    },
    {
      ...FACTORIES[WidgetType.Stat](9, 1),
      title: 'Total Revenue',
      config: {
        value: '–', subValue: 'consultation fees', trend: '', trendUp: true,
        accent: '#a78bfa', prefix: '£', suffix: '',
        description: 'Sum of all appointment prices', showSparkline: false, sparkData: [],
        selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'price', function: AggregationFunction.Sum },
          periodLabel: 'All time',
        },
      },
    },

    // ── Row 3 — bar chart + pie chart ──────────────────────────
    {
      ...FACTORIES[WidgetType.Bar](0, 3),
      w: 7, h: 3,
      title: 'Appointments by Month',
      config: {
        accent: '#3b82f6', stacked: false, horizontal: false,
        showGrid: true, showLegend: false, series: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          dateAxis: { entity: 'appointment', field: 'start_date', interval: DateInterval.Month },
          valueAgg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
        },
      },
    },
    {
      ...FACTORIES[WidgetType.Pie](7, 3),
      w: 5, h: 3,
      title: 'By Payor Type',
      config: {
        innerRadius: 50, showLabels: false, showLegend: true, data: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          groupBy: { entity: 'appointment_patient', field: 'payor_type' },
          valueAgg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
        },
      },
    },

    // ── Row 6 — analytics card + appointments table ────────────
    {
      ...FACTORIES[WidgetType.Analytics](0, 6),
      w: 4, h: 3,
      title: 'Appointment Trend',
      config: {
        value: '–', changeValue: '', changeLabel: 'vs previous period',
        trendUp: true, accent: '#3b82f6', data: [], period: '',
        selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          periodLabel: 'Monthly trend',
          trend: { entity: 'appointment', field: 'start_date', interval: DateInterval.Month, periods: 12 },
        },
      },
    },
    {
      ...FACTORIES[WidgetType.Table](4, 6),
      w: 8, h: 3,
      title: 'Recent Appointments',
      config: {
        striped: true, compact: false, statusColumn: true,
        columns: [], rows: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient', 'patient', 'contact'],
          columns: [
            { entity: 'appointment',         field: 'identifier'  },
            { entity: 'appointment',         field: 'start_date'  },
            { entity: 'appointment',         field: 'status'      },
            { entity: 'appointment_patient', field: 'payor_type'  },
            { entity: 'appointment_patient', field: 'price'       },
            { entity: 'contact',             field: 'firstname'   },
            { entity: 'contact',             field: 'lastname'    },
          ],
          sort: { entity: 'appointment', field: 'start_date', direction: SortDirection.Desc },
          pageSize: 20,
        },
      },
    },

    // ── Section: Extended Analytics ────────────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 9),
      title: 'Section',
      config: { label: 'Extended Analytics', accent: '#3b82f6', showLine: true, align: TextAlign.Left },
    },

    // ── Row 10 — 4 additional stat cards ──────────────────────
    {
      ...FACTORIES[WidgetType.Stat](0, 10),
      title: 'Active Patients',
      config: {
        value: '–', subValue: 'registered patients', trend: '', trendUp: true,
        accent: '#06b6d4', prefix: '', suffix: '',
        description: 'Patients with status = active', showSparkline: false, sparkData: [],
        selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['patient'],
          agg: { entity: 'patient', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'patient', field: 'status', operator: FilterOperator.Eq, value: 'active' }],
          periodLabel: 'Current',
        },
      },
    },
    {
      ...FACTORIES[WidgetType.Stat](3, 10),
      title: 'Cancelled Appointments',
      config: {
        value: '–', subValue: 'all time', trend: '', trendUp: false,
        accent: '#f97316', prefix: '', suffix: '',
        description: 'Appointments with status = cancelled', showSparkline: false, sparkData: [],
        selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filters: [{ entity: 'appointment', field: 'status', operator: FilterOperator.Eq, value: 'cancelled' }],
          periodLabel: 'All time',
        },
      },
    },
    {
      ...FACTORIES[WidgetType.Stat](6, 10),
      title: 'Remote Appointments',
      config: {
        value: '–', subValue: 'video consultations', trend: '', trendUp: true,
        accent: '#22c55e', prefix: '', suffix: '',
        description: 'Appointments delivered via video consultation', showSparkline: false, sparkData: [],
        selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filters: [{ entity: 'appointment', field: 'is_remote_appointment', operator: FilterOperator.Eq, value: 'true' }],
          periodLabel: 'All time',
        },
      },
    },
    {
      ...FACTORIES[WidgetType.Stat](9, 10),
      title: 'Invoiced Appointments',
      config: {
        value: '–', subValue: 'billed to payor', trend: '', trendUp: true,
        accent: '#a78bfa', prefix: '', suffix: '',
        description: 'Appointments with invoiced = true', showSparkline: false, sparkData: [],
        selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filters: [{ entity: 'appointment', field: 'invoiced', operator: FilterOperator.Eq, value: 'true' }],
          periodLabel: 'All time',
        },
      },
    },

    // ── Row 12 — line chart + status pie ──────────────────────
    {
      ...FACTORIES[WidgetType.Line](0, 12),
      w: 6, h: 3,
      title: 'Monthly Appointment Trend',
      config: {
        areaFill: true, smooth: true, showGrid: true, showDots: false, showLegend: false,
        series: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          dateAxis: { entity: 'appointment', field: 'start_date', interval: DateInterval.Month },
          valueAgg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
        },
      },
    },
    {
      ...FACTORIES[WidgetType.Pie](6, 12),
      w: 6, h: 3,
      title: 'Appointment Status Breakdown',
      config: {
        innerRadius: 0, showLabels: true, showLegend: true, data: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          groupBy: { entity: 'appointment', field: 'status' },
          valueAgg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
        },
      },
    },

    // ── Row 15 — patient contact details table ─────────────────
    {
      ...FACTORIES[WidgetType.Table](0, 15),
      w: 12, h: 3,
      title: 'Patient Contact List',
      config: {
        striped: true, compact: true, statusColumn: false,
        columns: [], rows: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['patient', 'contact', 'contact_address', 'address'],
          columns: [
            { entity: 'patient',  field: 'mrn'        },
            { entity: 'contact',  field: 'title'      },
            { entity: 'contact',  field: 'firstname'  },
            { entity: 'contact',  field: 'lastname'   },
            { entity: 'patient',  field: 'date_of_birth' },
            { entity: 'patient',  field: 'sex'        },
            { entity: 'patient',  field: 'status'     },
            { entity: 'address',  field: 'address1'   },
            { entity: 'address',  field: 'postcode'   },
          ],
          sort: { entity: 'contact', field: 'lastname', direction: SortDirection.Asc },
          pageSize: 20,
        },
      },
    },
  ];
}


// ───────────────────────────────────────────────────────────────
//  ACCOUNTING
// ───────────────────────────────────────────────────────────────

function buildAccounting(): Widget[] {
  return [
    {
      ...FACTORIES[WidgetType.Section](0, 0),
      title: 'Section',
      config: { label: 'Accounting Dashboard', accent: '#10b981', showLine: true, align: TextAlign.Left },
    },

    // ── Row 1 — 4 stat cards ───────────────────────────────────
    {
      ...FACTORIES[WidgetType.Stat](0, 1),
      title: 'Total Invoices',
      config: {
        value: '–', subValue: 'all invoices', trend: '', trendUp: true,
        accent: '#3b82f6', prefix: '', suffix: '',
        description: 'Total invoice count', showSparkline: false, sparkData: [],
        selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'id', function: AggregationFunction.Count },
          periodLabel: 'All time',
        },
      },
    },
    {
      ...FACTORIES[WidgetType.Stat](3, 1),
      title: 'Total Revenue',
      config: {
        value: '–', subValue: 'invoiced amount', trend: '', trendUp: true,
        accent: '#10b981', prefix: '£', suffix: '',
        description: 'Sum of all invoice totals (excl. void)', showSparkline: false, sparkData: [],
        selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'total_amount', function: AggregationFunction.Sum },
          filters: [{ entity: 'invoice', field: 'is_void', operator: FilterOperator.Eq, value: 'false' }],
          periodLabel: 'All time',
        },
      },
    },
    {
      ...FACTORIES[WidgetType.Stat](6, 1),
      title: 'Overdue Invoices',
      config: {
        value: '–', subValue: 'need attention', trend: '', trendUp: false,
        accent: '#ef4444', prefix: '', suffix: '',
        description: 'Invoices with status = overdue', showSparkline: false, sparkData: [],
        selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'invoice', field: 'status', operator: FilterOperator.Eq, value: 'overdue' }],
          periodLabel: 'All time',
        },
      },
    },
    {
      ...FACTORIES[WidgetType.Stat](9, 1),
      title: 'Payments Received',
      config: {
        value: '–', subValue: 'cleared payments', trend: '', trendUp: true,
        accent: '#22c55e', prefix: '£', suffix: '',
        description: 'Sum of all cleared payment amounts', showSparkline: false, sparkData: [],
        selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice', 'payment_allocation', 'payment'],
          agg: { entity: 'payment', field: 'amount', function: AggregationFunction.Sum },
          filters: [{ entity: 'payment', field: 'status', operator: FilterOperator.Eq, value: 'cleared' }],
          periodLabel: 'All time',
        },
      },
    },

    // ── Row 3 — bar + pie ──────────────────────────────────────
    {
      ...FACTORIES[WidgetType.Bar](0, 3),
      w: 7, h: 3,
      title: 'Revenue by Month',
      config: {
        accent: '#10b981', stacked: false, horizontal: false,
        showGrid: true, showLegend: false, series: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          dateAxis: { entity: 'invoice', field: 'invoice_date', interval: DateInterval.Month },
          valueAgg: { entity: 'invoice', field: 'total_amount', function: AggregationFunction.Sum },
        },
      },
    },
    {
      ...FACTORIES[WidgetType.Pie](7, 3),
      w: 5, h: 3,
      title: 'Invoices by Status',
      config: {
        innerRadius: 50, showLabels: false, showLegend: true, data: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          groupBy: { entity: 'invoice', field: 'status' },
          valueAgg: { entity: 'invoice', field: 'id', function: AggregationFunction.Count },
        },
      },
    },

    // ── Row 6 — analytics + invoice table ─────────────────────
    {
      ...FACTORIES[WidgetType.Analytics](0, 6),
      w: 4, h: 3,
      title: 'Invoice Trend',
      config: {
        value: '–', changeValue: '', changeLabel: 'vs previous period',
        trendUp: true, accent: '#10b981', data: [], period: '',
        selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'id', function: AggregationFunction.Count },
          periodLabel: 'Monthly trend',
          trend: { entity: 'invoice', field: 'invoice_date', interval: DateInterval.Month, periods: 12 },
        },
      },
    },
    {
      ...FACTORIES[WidgetType.Table](4, 6),
      w: 8, h: 3,
      title: 'Recent Invoices',
      config: {
        striped: true, compact: false, statusColumn: true,
        columns: [], rows: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          columns: [
            { entity: 'invoice', field: 'invoice_number' },
            { entity: 'invoice', field: 'invoice_date'   },
            { entity: 'invoice', field: 'status'         },
            { entity: 'invoice', field: 'total_amount'   },
            { entity: 'invoice', field: 'due_date'       },
            { entity: 'invoice', field: 'currency_code'  },
            { entity: 'invoice', field: 'site_id'        },
          ],
          sort: { entity: 'invoice', field: 'invoice_date', direction: SortDirection.Desc },
          pageSize: 20,
        },
      },
    },

    // ── Section: Payments & Claims ─────────────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 9),
      title: 'Section',
      config: { label: 'Payments & Claims', accent: '#10b981', showLine: true, align: TextAlign.Left },
    },

    // ── Row 10 — 4 additional stat cards ──────────────────────
    {
      ...FACTORIES[WidgetType.Stat](0, 10),
      title: 'Paid Invoices',
      config: {
        value: '–', subValue: 'fully paid', trend: '', trendUp: true,
        accent: '#22c55e', prefix: '', suffix: '',
        description: 'Invoices with status = paid', showSparkline: false, sparkData: [],
        selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'invoice', field: 'status', operator: FilterOperator.Eq, value: 'paid' }],
          periodLabel: 'All time',
        },
      },
    },
    {
      ...FACTORIES[WidgetType.Stat](3, 10),
      title: 'Pending Invoices',
      config: {
        value: '–', subValue: 'awaiting payment', trend: '', trendUp: false,
        accent: '#f59e0b', prefix: '', suffix: '',
        description: 'Invoices with status = pending', showSparkline: false, sparkData: [],
        selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'invoice', field: 'status', operator: FilterOperator.Eq, value: 'pending' }],
          periodLabel: 'All time',
        },
      },
    },
    {
      ...FACTORIES[WidgetType.Stat](6, 10),
      title: 'Total Claims',
      config: {
        value: '–', subValue: 'submitted claims', trend: '', trendUp: true,
        accent: '#3b82f6', prefix: '', suffix: '',
        description: 'Total number of insurance claims', showSparkline: false, sparkData: [],
        selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice', 'claim'],
          agg: { entity: 'claim', field: 'id', function: AggregationFunction.Count },
          periodLabel: 'All time',
        },
      },
    },
    {
      ...FACTORIES[WidgetType.Stat](9, 10),
      title: 'Approved Claims',
      config: {
        value: '–', subValue: 'approved amount', trend: '', trendUp: true,
        accent: '#10b981', prefix: '£', suffix: '',
        description: 'Sum of approved_amount from all approved claims', showSparkline: false, sparkData: [],
        selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice', 'claim'],
          agg: { entity: 'claim', field: 'approved_amount', function: AggregationFunction.Sum },
          filters: [{ entity: 'claim', field: 'status', operator: FilterOperator.Eq, value: 'approved' }],
          periodLabel: 'All time',
        },
      },
    },

    // ── Row 12 — line chart + payments pie ────────────────────
    {
      ...FACTORIES[WidgetType.Line](0, 12),
      w: 6, h: 3,
      title: 'Monthly Revenue Trend',
      config: {
        areaFill: true, smooth: true, showGrid: true, showDots: false, showLegend: false,
        series: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          dateAxis: { entity: 'invoice', field: 'invoice_date', interval: DateInterval.Month },
          valueAgg: { entity: 'invoice', field: 'total_amount', function: AggregationFunction.Sum },
        },
      },
    },
    {
      ...FACTORIES[WidgetType.Pie](6, 12),
      w: 6, h: 3,
      title: 'Payments by Method',
      config: {
        innerRadius: 50, showLabels: false, showLegend: true, data: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice', 'payment_allocation', 'payment'],
          groupBy: { entity: 'payment', field: 'payment_method' },
          valueAgg: { entity: 'payment', field: 'amount', function: AggregationFunction.Sum },
        },
      },
    },

    // ── Row 15 — revenue by site bar + recent payments table ──
    {
      ...FACTORIES[WidgetType.Bar](0, 15),
      w: 5, h: 3,
      title: 'Revenue by Site',
      config: {
        accent: '#10b981', stacked: false, horizontal: true,
        showGrid: true, showLegend: false, series: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          groupBy: { entity: 'invoice', field: 'site_id' },
          valueAgg: { entity: 'invoice', field: 'total_amount', function: AggregationFunction.Sum },
        },
      },
    },
    {
      ...FACTORIES[WidgetType.Table](5, 15),
      w: 7, h: 3,
      title: 'Recent Payments',
      config: {
        striped: true, compact: false, statusColumn: true,
        columns: [], rows: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice', 'payment_allocation', 'payment'],
          columns: [
            { entity: 'payment', field: 'reference'      },
            { entity: 'payment', field: 'payment_date'   },
            { entity: 'payment', field: 'payment_method' },
            { entity: 'payment', field: 'amount'         },
            { entity: 'payment', field: 'status'         },
            { entity: 'payment', field: 'site_id'        },
          ],
          sort: { entity: 'payment', field: 'payment_date', direction: SortDirection.Desc },
          pageSize: 20,
        },
      },
    },

    // ── Row 18 — claims table ──────────────────────────────────
    {
      ...FACTORIES[WidgetType.Table](0, 18),
      w: 12, h: 3,
      title: 'Claims Overview',
      config: {
        striped: true, compact: true, statusColumn: true,
        columns: [], rows: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice', 'claim', 'payer'],
          columns: [
            { entity: 'claim',   field: 'claim_number'    },
            { entity: 'claim',   field: 'submitted_date'  },
            { entity: 'claim',   field: 'status'          },
            { entity: 'claim',   field: 'claimed_amount'  },
            { entity: 'claim',   field: 'approved_amount' },
            { entity: 'payer',   field: 'name'            },
            { entity: 'payer',   field: 'payer_type'      },
            { entity: 'invoice', field: 'invoice_number'  },
          ],
          sort: { entity: 'claim', field: 'submitted_date', direction: SortDirection.Desc },
          pageSize: 20,
        },
      },
    },
  ];
}


// ───────────────────────────────────────────────────────────────
//  PRESCRIPTIONS
// ───────────────────────────────────────────────────────────────

function buildPrescriptions(): Widget[] {
  return [
    {
      ...FACTORIES[WidgetType.Section](0, 0),
      title: 'Section',
      config: { label: 'Prescriptions Dashboard', accent: '#a78bfa', showLine: true, align: TextAlign.Left },
    },

    // ── Row 1 — 4 stat cards ───────────────────────────────────
    {
      ...FACTORIES[WidgetType.Stat](0, 1),
      title: 'Total Prescriptions',
      config: {
        value: '–', subValue: 'all time', trend: '', trendUp: true,
        accent: '#a78bfa', prefix: '', suffix: '',
        description: 'Total prescriptions issued', showSparkline: false, sparkData: [],
        selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          agg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          periodLabel: 'All time',
        },
      },
    },
    {
      ...FACTORIES[WidgetType.Stat](3, 1),
      title: 'Active Prescriptions',
      config: {
        value: '–', subValue: 'currently active', trend: '', trendUp: true,
        accent: '#3b82f6', prefix: '', suffix: '',
        description: 'Prescriptions with status = active', showSparkline: false, sparkData: [],
        selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          agg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'prescription', field: 'status', operator: FilterOperator.Eq, value: 'active' }],
          periodLabel: 'Current',
        },
      },
    },
    {
      ...FACTORIES[WidgetType.Stat](6, 1),
      title: 'Controlled Substances',
      config: {
        value: '–', subValue: 'prescriptions', trend: '', trendUp: false,
        accent: '#f97316', prefix: '', suffix: '',
        description: 'Prescriptions for controlled medications', showSparkline: false, sparkData: [],
        selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription', 'prescription_item', 'medication'],
          agg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'medication', field: 'is_controlled', operator: FilterOperator.Eq, value: 'true' }],
          periodLabel: 'All time',
        },
      },
    },
    {
      ...FACTORIES[WidgetType.Stat](9, 1),
      title: 'Repeat Prescriptions',
      config: {
        value: '–', subValue: 'repeat scripts', trend: '', trendUp: true,
        accent: '#22c55e', prefix: '', suffix: '',
        description: 'Prescriptions marked as repeat (is_repeat = true)', showSparkline: false, sparkData: [],
        selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          agg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'prescription', field: 'is_repeat', operator: FilterOperator.Eq, value: 'true' }],
          periodLabel: 'All time',
        },
      },
    },

    // ── Row 3 — bar + pie ──────────────────────────────────────
    {
      ...FACTORIES[WidgetType.Bar](0, 3),
      w: 7, h: 3,
      title: 'Prescriptions by Month',
      config: {
        accent: '#a78bfa', stacked: false, horizontal: false,
        showGrid: true, showLegend: false, series: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          dateAxis: { entity: 'prescription', field: 'prescribed_date', interval: DateInterval.Month },
          valueAgg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
        },
      },
    },
    {
      ...FACTORIES[WidgetType.Pie](7, 3),
      w: 5, h: 3,
      title: 'By Drug Class',
      config: {
        innerRadius: 50, showLabels: false, showLegend: true, data: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription', 'prescription_item', 'medication'],
          groupBy: { entity: 'medication', field: 'drug_class' },
          valueAgg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          topN: 8,
        },
      },
    },

    // ── Row 6 — analytics + prescription table ─────────────────
    {
      ...FACTORIES[WidgetType.Analytics](0, 6),
      w: 4, h: 3,
      title: 'Prescription Trend',
      config: {
        value: '–', changeValue: '', changeLabel: 'vs previous period',
        trendUp: true, accent: '#a78bfa', data: [], period: '',
        selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          agg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          periodLabel: 'Monthly trend',
          trend: { entity: 'prescription', field: 'prescribed_date', interval: DateInterval.Month, periods: 12 },
        },
      },
    },
    {
      ...FACTORIES[WidgetType.Table](4, 6),
      w: 8, h: 3,
      title: 'Recent Prescriptions',
      config: {
        striped: true, compact: false, statusColumn: true,
        columns: [], rows: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription', 'prescription_item', 'medication', 'prescriber'],
          columns: [
            { entity: 'prescription',      field: 'prescription_number' },
            { entity: 'prescription',      field: 'prescribed_date'     },
            { entity: 'prescription',      field: 'status'              },
            { entity: 'medication',        field: 'name'                },
            { entity: 'medication',        field: 'drug_class'          },
            { entity: 'medication',        field: 'is_controlled'       },
            { entity: 'prescriber',        field: 'lastname'            },
            { entity: 'prescription_item', field: 'quantity'            },
            { entity: 'prescription_item', field: 'unit'                },
          ],
          sort: { entity: 'prescription', field: 'prescribed_date', direction: SortDirection.Desc },
          pageSize: 20,
        },
      },
    },

    // ── Section: Dispensing & Prescribers ─────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 9),
      title: 'Section',
      config: { label: 'Dispensing & Prescribers', accent: '#a78bfa', showLine: true, align: TextAlign.Left },
    },

    // ── Row 10 — 4 additional stat cards ──────────────────────
    {
      ...FACTORIES[WidgetType.Stat](0, 10),
      title: 'Total Dispenses',
      config: {
        value: '–', subValue: 'items dispensed', trend: '', trendUp: true,
        accent: '#06b6d4', prefix: '', suffix: '',
        description: 'Total number of dispense records', showSparkline: false, sparkData: [],
        selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription', 'dispense'],
          agg: { entity: 'dispense', field: 'id', function: AggregationFunction.Count },
          periodLabel: 'All time',
        },
      },
    },
    {
      ...FACTORIES[WidgetType.Stat](3, 10),
      title: 'Expired Prescriptions',
      config: {
        value: '–', subValue: 'past expiry date', trend: '', trendUp: false,
        accent: '#ef4444', prefix: '', suffix: '',
        description: 'Prescriptions with status = expired', showSparkline: false, sparkData: [],
        selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          agg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'prescription', field: 'status', operator: FilterOperator.Eq, value: 'expired' }],
          periodLabel: 'All time',
        },
      },
    },
    {
      ...FACTORIES[WidgetType.Stat](6, 10),
      title: 'Completed Prescriptions',
      config: {
        value: '–', subValue: 'fully dispensed', trend: '', trendUp: true,
        accent: '#22c55e', prefix: '', suffix: '',
        description: 'Prescriptions with status = completed', showSparkline: false, sparkData: [],
        selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          agg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'prescription', field: 'status', operator: FilterOperator.Eq, value: 'completed' }],
          periodLabel: 'All time',
        },
      },
    },
    {
      ...FACTORIES[WidgetType.Stat](9, 10),
      title: 'Unique Prescribers',
      config: {
        value: '–', subValue: 'active prescribers', trend: '', trendUp: true,
        accent: '#a78bfa', prefix: '', suffix: '',
        description: 'Count of active prescribers', showSparkline: false, sparkData: [],
        selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescriber'],
          agg: { entity: 'prescriber', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'prescriber', field: 'is_active', operator: FilterOperator.Eq, value: 'true' }],
          periodLabel: 'Current',
        },
      },
    },

    // ── Row 12 — dispenses line chart + prescriber type bar ───
    {
      ...FACTORIES[WidgetType.Line](0, 12),
      w: 6, h: 3,
      title: 'Dispenses by Month',
      config: {
        areaFill: true, smooth: true, showGrid: true, showDots: false, showLegend: false,
        series: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription', 'dispense'],
          dateAxis: { entity: 'dispense', field: 'dispensed_date', interval: DateInterval.Month },
          valueAgg: { entity: 'dispense', field: 'id', function: AggregationFunction.Count },
        },
      },
    },
    {
      ...FACTORIES[WidgetType.Bar](6, 12),
      w: 6, h: 3,
      title: 'Prescriptions by Prescriber Type',
      config: {
        accent: '#a78bfa', stacked: false, horizontal: true,
        showGrid: true, showLegend: false, series: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription', 'prescriber'],
          groupBy: { entity: 'prescriber', field: 'prescriber_type' },
          valueAgg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
        },
      },
    },

    // ── Row 15 — dispenses table + prescription status pie ────
    {
      ...FACTORIES[WidgetType.Table](0, 15),
      w: 7, h: 3,
      title: 'Recent Dispenses',
      config: {
        striped: true, compact: false, statusColumn: true,
        columns: [], rows: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription', 'dispense'],
          columns: [
            { entity: 'prescription', field: 'prescription_number' },
            { entity: 'dispense',     field: 'dispensed_date'      },
            { entity: 'dispense',     field: 'dispensed_quantity'  },
            { entity: 'dispense',     field: 'status'              },
            { entity: 'dispense',     field: 'site_id'             },
          ],
          sort: { entity: 'dispense', field: 'dispensed_date', direction: SortDirection.Desc },
          pageSize: 20,
        },
      },
    },
    {
      ...FACTORIES[WidgetType.Pie](7, 15),
      w: 5, h: 3,
      title: 'Prescription Status Split',
      config: {
        innerRadius: 0, showLabels: true, showLegend: true, data: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          groupBy: { entity: 'prescription', field: 'status' },
          valueAgg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
        },
      },
    },

    // ── Row 18 — prescriber detail table ──────────────────────
    {
      ...FACTORIES[WidgetType.Table](0, 18),
      w: 12, h: 3,
      title: 'Prescriber Directory',
      config: {
        striped: true, compact: true, statusColumn: false,
        columns: [], rows: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescriber'],
          columns: [
            { entity: 'prescriber', field: 'registration_number' },
            { entity: 'prescriber', field: 'firstname'           },
            { entity: 'prescriber', field: 'lastname'            },
            { entity: 'prescriber', field: 'prescriber_type'     },
            { entity: 'prescriber', field: 'specialty'           },
            { entity: 'prescriber', field: 'site_id'             },
            { entity: 'prescriber', field: 'is_active'           },
          ],
          sort: { entity: 'prescriber', field: 'lastname', direction: SortDirection.Asc },
          pageSize: 20,
        },
      },
    },
  ];
}


// ───────────────────────────────────────────────────────────────
//  EXPORT
// ───────────────────────────────────────────────────────────────

export const PRODUCT_TEMPLATES: DashboardTemplate[] = [
  {
    id:          'epx',
    name:        'EPX Clinical',
    description: 'Appointments, payor breakdown, patient data, monthly trends',
    icon:        '🏥',
    color:       '#3b82f6',
    build:       buildEpx,
  },
  {
    id:          'accounting',
    name:        'Accounting',
    description: 'Invoices, revenue, payments, claims by status',
    icon:        '💰',
    color:       '#10b981',
    build:       buildAccounting,
  },
  {
    id:          'prescriptions',
    name:        'Prescriptions',
    description: 'Rx activity, drug classes, controlled substances, dispensing',
    icon:        '💊',
    color:       '#a78bfa',
    build:       buildPrescriptions,
  },
];
