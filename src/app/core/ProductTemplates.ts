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
  AggregationFunction, DateInterval, SortDirection, FilterOperator, FilterGroup, DerivedColumnDef,
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
          dateRangeField: { entity: 'appointment', field: 'start_date' },
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
          dateRangeField: { entity: 'appointment', field: 'start_date' },
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
          ],
          derivedColumns: [
            {
              key:       '__derived_appt_fullname',
              label:     'Patient Name',
              mode:      'concat',
              sources:   [
                { entity: 'contact', field: 'title'     },
                { entity: 'contact', field: 'firstname' },
                { entity: 'contact', field: 'lastname'  },
              ],
              separator: ' ',
            } as DerivedColumnDef,
          ],
          // Show only completed or active appointments that have been invoiced
          filterGroups: [
            {
              id:     'epx-appt-status',
              logic:  'OR',
              conditions: [
                { entity: 'appointment', field: 'status', operator: FilterOperator.Eq, value: 'completed' },
                { entity: 'appointment', field: 'status', operator: FilterOperator.Eq, value: 'active'    },
              ],
            } as FilterGroup,
            {
              id:     'epx-appt-invoiced',
              logic:  'AND',
              conditions: [
                { entity: 'appointment', field: 'invoiced', operator: FilterOperator.Eq, value: 'true' },
              ],
            } as FilterGroup,
          ],
          sort: { entity: 'appointment', field: 'start_date', direction: SortDirection.Desc },
          pageSize: 20,
          dateRangeField: { entity: 'appointment', field: 'start_date' },
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
          dateRangeField: { entity: 'appointment', field: 'start_date' },
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
            { entity: 'patient',  field: 'mrn'          },
            { entity: 'patient',  field: 'date_of_birth' },
            { entity: 'patient',  field: 'sex'           },
            { entity: 'patient',  field: 'status'        },
            { entity: 'address',  field: 'address1'      },
            { entity: 'address',  field: 'postcode'      },
          ],
          derivedColumns: [
            {
              key:       '__derived_patient_fullname',
              label:     'Full Name',
              mode:      'concat',
              sources:   [
                { entity: 'contact', field: 'title'     },
                { entity: 'contact', field: 'firstname' },
                { entity: 'contact', field: 'lastname'  },
              ],
              separator: ' ',
            } as DerivedColumnDef,
          ],
          // Only active patients
          filterGroups: [
            {
              id:     'epx-patient-active',
              logic:  'AND',
              conditions: [
                { entity: 'patient', field: 'status', operator: FilterOperator.Eq, value: 'active' },
              ],
            } as FilterGroup,
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
          dateRangeField: { entity: 'invoice', field: 'invoice_date' },
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
          dateRangeField: { entity: 'invoice', field: 'invoice_date' },
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
            { entity: 'invoice', field: 'net_amount'     },
            { entity: 'invoice', field: 'tax_amount'     },
            { entity: 'invoice', field: 'due_date'       },
            { entity: 'invoice', field: 'currency_code'  },
          ],
          derivedColumns: [
            {
              key:     '__derived_gross_value',
              label:   'Gross Value',
              mode:    'sum',
              sources: [
                { entity: 'invoice', field: 'net_amount' },
                { entity: 'invoice', field: 'tax_amount' },
              ],
            } as DerivedColumnDef,
          ],
          // Pending or overdue non-void invoices
          filterGroups: [
            {
              id:     'acc-invoice-status',
              logic:  'OR',
              conditions: [
                { entity: 'invoice', field: 'status', operator: FilterOperator.Eq, value: 'pending'  },
                { entity: 'invoice', field: 'status', operator: FilterOperator.Eq, value: 'overdue'  },
              ],
            } as FilterGroup,
            {
              id:     'acc-invoice-not-void',
              logic:  'AND',
              conditions: [
                { entity: 'invoice', field: 'is_void', operator: FilterOperator.Eq, value: 'false' },
              ],
            } as FilterGroup,
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
          derivedColumns: [
            {
              key:     '__derived_claim_variance',
              label:   'Variance',
              mode:    'subtract',
              sources: [
                { entity: 'claim', field: 'claimed_amount'  },
                { entity: 'claim', field: 'approved_amount' },
              ],
            } as DerivedColumnDef,
          ],
          // Approved or pending claims only
          filterGroups: [
            {
              id:     'acc-claim-status',
              logic:  'OR',
              conditions: [
                { entity: 'claim', field: 'status', operator: FilterOperator.Eq, value: 'approved' },
                { entity: 'claim', field: 'status', operator: FilterOperator.Eq, value: 'pending'  },
              ],
            } as FilterGroup,
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
          dateRangeField: { entity: 'prescription', field: 'prescribed_date' },
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
          dateRangeField: { entity: 'prescription', field: 'prescribed_date' },
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
            { entity: 'medication',        field: 'drug_class'          },
            { entity: 'medication',        field: 'is_controlled'       },
            { entity: 'prescription_item', field: 'quantity'            },
            { entity: 'prescription_item', field: 'unit'                },
          ],
          derivedColumns: [
            {
              key:       '__derived_rx_prescriber',
              label:     'Prescriber',
              mode:      'concat',
              sources:   [
                { entity: 'prescriber', field: 'firstname' },
                { entity: 'prescriber', field: 'lastname'  },
              ],
              separator: ' ',
            } as DerivedColumnDef,
            {
              key:       '__derived_rx_medication',
              label:     'Medication',
              mode:      'concat',
              sources:   [
                { entity: 'medication', field: 'name'     },
                { entity: 'medication', field: 'strength' },
              ],
              separator: ' ',
            } as DerivedColumnDef,
          ],
          // Active or dispensed prescriptions only
          filterGroups: [
            {
              id:     'rx-prescription-status',
              logic:  'OR',
              conditions: [
                { entity: 'prescription', field: 'status', operator: FilterOperator.Eq, value: 'active'    },
                { entity: 'prescription', field: 'status', operator: FilterOperator.Eq, value: 'dispensed' },
              ],
            } as FilterGroup,
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
//  AGGREGATION FUNCTIONS SHOWCASE
//  Demonstrates: COUNT, COUNT_DISTINCT, SUM, AVG, MIN, MAX
//  Each widget is annotated with which function it demonstrates.
// ───────────────────────────────────────────────────────────────

function buildAggregations(): Widget[] {
  return [
    // ── Section header ─────────────────────────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 0),
      title: 'Section',
      config: { label: 'Aggregation Functions Showcase', accent: '#6366f1', showLine: true, align: TextAlign.Left },
    },

    // ── Row 1 — COUNT · COUNT_DISTINCT · SUM · AVG ─────────────
    // [COUNT] — total rows in the join result
    {
      ...FACTORIES[WidgetType.Stat](0, 1),
      title: 'COUNT — Total Appointments',
      config: {
        value: '–', subValue: 'COUNT(appointment_id)', trend: '', trendUp: true,
        accent: '#6366f1', prefix: '', suffix: '',
        description: 'COUNT: counts every joined row — expected 43',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          periodLabel: 'All records',
        },
      },
    },
    // [COUNT_DISTINCT] — unique patients, even though some appear multiple times
    {
      ...FACTORIES[WidgetType.Stat](3, 1),
      title: 'COUNT DISTINCT — Unique Patients',
      config: {
        value: '–', subValue: 'COUNT_DISTINCT(patient_id)', trend: '', trendUp: true,
        accent: '#8b5cf6', prefix: '', suffix: '',
        description: 'COUNT_DISTINCT: deduplicates patient_id — 43 appointments but only 15 unique patients',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'patient_id', function: AggregationFunction.CountDistinct },
          periodLabel: 'All records',
        },
      },
    },
    // [SUM] — add up all price values
    {
      ...FACTORIES[WidgetType.Stat](6, 1),
      title: 'SUM — Total Revenue',
      config: {
        value: '–', subValue: 'SUM(price)', trend: '', trendUp: true,
        accent: '#10b981', prefix: '£', suffix: '',
        description: 'SUM: adds all price values across joined rows',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'price', function: AggregationFunction.Sum },
          periodLabel: 'All records',
        },
      },
    },
    // [AVG] — mean price across all appointments
    {
      ...FACTORIES[WidgetType.Stat](9, 1),
      title: 'AVG — Mean Consultation Fee',
      config: {
        value: '–', subValue: 'AVG(price)', trend: '', trendUp: true,
        accent: '#f59e0b', prefix: '£', suffix: '',
        description: 'AVG: arithmetic mean of price — includes £0.00 rows for dna/cancelled',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'price', function: AggregationFunction.Avg },
          periodLabel: 'All records',
        },
      },
    },

    // ── Row 2 — MIN · MAX (plus AVG/MIN/MAX on nullable rating) ─
    // [MIN] — lowest non-null price
    {
      ...FACTORIES[WidgetType.Stat](0, 2),
      title: 'MIN — Lowest Price',
      config: {
        value: '–', subValue: 'MIN(price)', trend: '', trendUp: true,
        accent: '#06b6d4', prefix: '£', suffix: '',
        description: 'MIN: smallest price value in the dataset — £0.00 for dna/cancelled rows',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'price', function: AggregationFunction.Min },
          periodLabel: 'All records',
        },
      },
    },
    // [MAX] — highest price
    {
      ...FACTORIES[WidgetType.Stat](3, 2),
      title: 'MAX — Highest Price',
      config: {
        value: '–', subValue: 'MAX(price)', trend: '', trendUp: true,
        accent: '#ef4444', prefix: '£', suffix: '',
        description: 'MAX: largest price value — £150.00 for corporate payor type',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'price', function: AggregationFunction.Max },
          periodLabel: 'All records',
        },
      },
    },
    // [AVG on nullable field] — avg rating skips null rows automatically
    {
      ...FACTORIES[WidgetType.Stat](6, 2),
      title: 'AVG — Rating (nulls skipped)',
      config: {
        value: '–', subValue: 'AVG(rating)', trend: '', trendUp: true,
        accent: '#f97316', prefix: '', suffix: ' / 5',
        description: 'AVG on nullable field: dna/cancelled rows have rating=null — nulls are excluded from the average',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'rating', function: AggregationFunction.Avg },
          periodLabel: 'Rated appointments only',
        },
      },
    },
    // [MIN/MAX on nullable] — min/max rating also skip nulls
    {
      ...FACTORIES[WidgetType.Stat](9, 2),
      title: 'MIN Duration (mins)',
      config: {
        value: '–', subValue: 'MIN(duration_minutes)', trend: '', trendUp: true,
        accent: '#22c55e', prefix: '', suffix: ' min',
        description: 'MIN on appointment.duration_minutes — shortest slot is 30 minutes',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment'],
          agg: { entity: 'appointment', field: 'duration_minutes', function: AggregationFunction.Min },
          periodLabel: 'All records',
        },
      },
    },

    // ── Row 4 — COUNT by month bar + SUM by payor pie ──────────
    // [COUNT in chart] — how many appointments per month
    {
      ...FACTORIES[WidgetType.Bar](0, 4),
      w: 7, h: 3,
      title: 'COUNT — Appointments by Month',
      config: {
        accent: '#6366f1', stacked: false, horizontal: false,
        showGrid: true, showLegend: false, series: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          dateAxis: { entity: 'appointment', field: 'start_date', interval: DateInterval.Month },
          valueAgg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          dateRangeField: { entity: 'appointment', field: 'start_date' },
        },
      },
    },
    // [SUM grouped by category] — total revenue split by payor type
    {
      ...FACTORIES[WidgetType.Pie](7, 4),
      w: 5, h: 3,
      title: 'SUM — Revenue by Payor Type',
      config: {
        innerRadius: 50, showLabels: false, showLegend: true, data: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          groupBy: { entity: 'appointment_patient', field: 'payor_type' },
          valueAgg: { entity: 'appointment_patient', field: 'price', function: AggregationFunction.Sum },
          dateRangeField: { entity: 'appointment', field: 'start_date' },
        },
      },
    },

    // ── Row 7 — AVG trend analytics + full detail table ────────
    // [AVG in analytics] — average fee trend over months
    {
      ...FACTORIES[WidgetType.Analytics](0, 7),
      w: 4, h: 3,
      title: 'AVG Price — Monthly Trend',
      config: {
        value: '–', changeValue: '', changeLabel: 'vs previous period',
        trendUp: true, accent: '#f59e0b', data: [], period: '',
        selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'price', function: AggregationFunction.Avg },
          periodLabel: 'Monthly avg',
          trend: { entity: 'appointment', field: 'start_date', interval: DateInterval.Month, periods: 12 },
        },
      },
    },
    // [Table] — all aggregatable fields side by side for comparison
    {
      ...FACTORIES[WidgetType.Table](4, 7),
      w: 8, h: 3,
      title: 'Appointments — Price, Rating & Duration',
      config: {
        striped: true, compact: false, statusColumn: true,
        columns: [], rows: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          columns: [
            { entity: 'appointment',         field: 'identifier'       },
            { entity: 'appointment',         field: 'start_date'       },
            { entity: 'appointment',         field: 'status'           },
            { entity: 'appointment',         field: 'duration_minutes' },
            { entity: 'appointment_patient', field: 'payor_type'       },
            { entity: 'appointment_patient', field: 'price'            },
            { entity: 'appointment_patient', field: 'rating'           },
            { entity: 'appointment_patient', field: 'notes'            },
          ],
          sort: { entity: 'appointment', field: 'start_date', direction: SortDirection.Desc },
          pageSize: 20,
          dateRangeField: { entity: 'appointment', field: 'start_date' },
        },
      },
    },

    // ── Section: Grouped Aggregations ──────────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 10),
      title: 'Section',
      config: { label: 'Grouped Aggregations', accent: '#6366f1', showLine: true, align: TextAlign.Left },
    },

    // ── Row 11 — aggregations with groupBy in charts ───────────
    // [COUNT_DISTINCT grouped] — distinct patients per payor type
    {
      ...FACTORIES[WidgetType.Bar](0, 11),
      w: 6, h: 3,
      title: 'COUNT DISTINCT — Patients per Payor Type',
      config: {
        accent: '#8b5cf6', stacked: false, horizontal: true,
        showGrid: true, showLegend: false, series: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          groupBy: { entity: 'appointment_patient', field: 'payor_type' },
          valueAgg: { entity: 'appointment_patient', field: 'patient_id', function: AggregationFunction.CountDistinct },
        },
      },
    },
    // [AVG grouped] — average price per site
    {
      ...FACTORIES[WidgetType.Bar](6, 11),
      w: 6, h: 3,
      title: 'AVG — Price per Site',
      config: {
        accent: '#f59e0b', stacked: false, horizontal: true,
        showGrid: true, showLegend: false, series: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          groupBy: { entity: 'appointment', field: 'site_id' },
          valueAgg: { entity: 'appointment_patient', field: 'price', function: AggregationFunction.Avg },
        },
      },
    },

    // ── Row 14 — SUM line trend + MAX/MIN per status pie ───────
    // [SUM over time] — cumulative revenue by month as a line
    {
      ...FACTORIES[WidgetType.Line](0, 14),
      w: 7, h: 3,
      title: 'SUM — Revenue Trend by Month',
      config: {
        areaFill: true, smooth: true, showGrid: true, showDots: false, showLegend: false,
        series: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          dateAxis: { entity: 'appointment', field: 'start_date', interval: DateInterval.Month },
          valueAgg: { entity: 'appointment_patient', field: 'price', function: AggregationFunction.Sum },
          dateRangeField: { entity: 'appointment', field: 'start_date' },
        },
      },
    },
    // [COUNT grouped by status] — appointment counts per status
    {
      ...FACTORIES[WidgetType.Pie](7, 14),
      w: 5, h: 3,
      title: 'COUNT — Appointments by Status',
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

    // ── Row 17 — MAX duration stat + AVG rating per payor bar ──
    // [MAX] — longest appointment slot
    {
      ...FACTORIES[WidgetType.Stat](0, 17),
      title: 'MAX — Longest Duration',
      config: {
        value: '–', subValue: 'MAX(duration_minutes)', trend: '', trendUp: true,
        accent: '#ef4444', prefix: '', suffix: ' min',
        description: 'MAX on appointment.duration_minutes — longest slot is 60 minutes',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment'],
          agg: { entity: 'appointment', field: 'duration_minutes', function: AggregationFunction.Max },
          periodLabel: 'All records',
        },
      },
    },
    // [MIN on nullable] — best (lowest) rating given — nulls excluded
    {
      ...FACTORIES[WidgetType.Stat](3, 17),
      title: 'MIN — Lowest Rating Given',
      config: {
        value: '–', subValue: 'MIN(rating)', trend: '', trendUp: false,
        accent: '#f97316', prefix: '', suffix: ' / 5',
        description: 'MIN on nullable rating — null rows (dna/cancelled/booked) are excluded automatically',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'rating', function: AggregationFunction.Min },
          periodLabel: 'Rated only',
        },
      },
    },
    // [MAX on nullable] — best (highest) rating given
    {
      ...FACTORIES[WidgetType.Stat](6, 17),
      title: 'MAX — Highest Rating Given',
      config: {
        value: '–', subValue: 'MAX(rating)', trend: '', trendUp: true,
        accent: '#22c55e', prefix: '', suffix: ' / 5',
        description: 'MAX on nullable rating — expected 5, null rows excluded',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'rating', function: AggregationFunction.Max },
          periodLabel: 'Rated only',
        },
      },
    },
    // [SUM on filtered set] — revenue from completed + invoiced only
    {
      ...FACTORIES[WidgetType.Stat](9, 17),
      title: 'SUM — Invoiced Revenue',
      config: {
        value: '–', subValue: 'SUM(price) where invoiced', trend: '', trendUp: true,
        accent: '#10b981', prefix: '£', suffix: '',
        description: 'SUM with filter: only appointments where invoiced=true contribute to the total',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'price', function: AggregationFunction.Sum },
          filters: [{ entity: 'appointment', field: 'invoiced', operator: FilterOperator.Eq, value: 'true' }],
          periodLabel: 'Invoiced only',
        },
      },
    },

    // ── Row 19 — AVG rating per payor type bar ─────────────────
    // [AVG grouped + nullable] — avg satisfaction per payor, nulls excluded
    {
      ...FACTORIES[WidgetType.Bar](0, 19),
      w: 12, h: 3,
      title: 'AVG Rating — by Payor Type (nulls excluded)',
      config: {
        accent: '#f97316', stacked: false, horizontal: false,
        showGrid: true, showLegend: false, series: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          groupBy: { entity: 'appointment_patient', field: 'payor_type' },
          valueAgg: { entity: 'appointment_patient', field: 'rating', function: AggregationFunction.Avg },
        },
      },
    },
  ];
}


// ───────────────────────────────────────────────────────────────
//  FILTER OPERATIONS SHOWCASE
//  Demonstrates: eq, neq, gt, gte, lt, lte,
//                is_null, is_not_null, in, not_in, contains
//  Each widget is annotated with which operator it uses.
// ───────────────────────────────────────────────────────────────

function buildFilterOps(): Widget[] {
  return [
    // ── Section header ─────────────────────────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 0),
      title: 'Section',
      config: { label: 'Filter Operations Showcase', accent: '#ec4899', showLine: true, align: TextAlign.Left },
    },

    // ── Row 1 — EQ · NEQ · GT · GTE ───────────────────────────
    // [EQ] — exact match
    {
      ...FACTORIES[WidgetType.Stat](0, 1),
      title: 'EQ — Completed Appointments',
      config: {
        value: '–', subValue: 'status = "completed"', trend: '', trendUp: true,
        accent: '#10b981', prefix: '', suffix: '',
        description: 'EQ (=): filters rows where status exactly equals "completed"',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filters: [{ entity: 'appointment', field: 'status', operator: FilterOperator.Eq, value: 'completed' }],
          periodLabel: 'EQ filter',
        },
      },
    },
    // [NEQ] — not equal
    {
      ...FACTORIES[WidgetType.Stat](3, 1),
      title: 'NEQ — Excluding No-Shows',
      config: {
        value: '–', subValue: 'status != "no_show"', trend: '', trendUp: true,
        accent: '#3b82f6', prefix: '', suffix: '',
        description: 'NEQ (!=): excludes rows where status = "no_show" — all other statuses included',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filters: [{ entity: 'appointment', field: 'status', operator: FilterOperator.Neq, value: 'no_show' }],
          periodLabel: 'NEQ filter',
        },
      },
    },
    // [GT] — strictly greater than
    {
      ...FACTORIES[WidgetType.Stat](6, 1),
      title: 'GT — Price > £100',
      config: {
        value: '–', subValue: 'price > 100', trend: '', trendUp: true,
        accent: '#f59e0b', prefix: '', suffix: '',
        description: 'GT (>): only rows where price is strictly greater than 100 — captures £120 and £150 tiers',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filters: [{ entity: 'appointment_patient', field: 'price', operator: FilterOperator.Gt, value: 100 }],
          periodLabel: 'GT filter',
        },
      },
    },
    // [GTE] — greater than or equal
    {
      ...FACTORIES[WidgetType.Stat](9, 1),
      title: 'GTE — Price >= £120',
      config: {
        value: '–', subValue: 'price >= 120', trend: '', trendUp: true,
        accent: '#a78bfa', prefix: '', suffix: '',
        description: 'GTE (>=): includes rows where price is exactly 120 or above — adds £120 rows vs GT > 100',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filters: [{ entity: 'appointment_patient', field: 'price', operator: FilterOperator.Gte, value: 120 }],
          periodLabel: 'GTE filter',
        },
      },
    },

    // ── Row 3 — LT · LTE · IN · NOT_IN ────────────────────────
    // [LT] — strictly less than
    {
      ...FACTORIES[WidgetType.Stat](0, 3),
      title: 'LT — Price < £100',
      config: {
        value: '–', subValue: 'price < 100', trend: '', trendUp: false,
        accent: '#ef4444', prefix: '', suffix: '',
        description: 'LT (<): only rows where price is less than 100 — captures £0 (dna/cancelled) and £85 rows',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filters: [{ entity: 'appointment_patient', field: 'price', operator: FilterOperator.Lt, value: 100 }],
          periodLabel: 'LT filter',
        },
      },
    },
    // [LTE] — less than or equal
    {
      ...FACTORIES[WidgetType.Stat](3, 3),
      title: 'LTE — Price <= £85',
      config: {
        value: '–', subValue: 'price <= 85', trend: '', trendUp: false,
        accent: '#f97316', prefix: '', suffix: '',
        description: 'LTE (<=): includes exactly £85 rows in addition to £0 rows — compare count with LT < 100',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filters: [{ entity: 'appointment_patient', field: 'price', operator: FilterOperator.Lte, value: 85 }],
          periodLabel: 'LTE filter',
        },
      },
    },
    // [IN] — match any value in a list
    {
      ...FACTORIES[WidgetType.Stat](6, 3),
      title: 'IN — Completed or Confirmed',
      config: {
        value: '–', subValue: 'status IN [completed, confirmed]', trend: '', trendUp: true,
        accent: '#22c55e', prefix: '', suffix: '',
        description: 'IN: matches any row where status is in the provided list — equivalent to EQ OR EQ',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filters: [{ entity: 'appointment', field: 'status', operator: FilterOperator.In, values: ['completed', 'confirmed'] }],
          periodLabel: 'IN filter',
        },
      },
    },
    // [NOT_IN] — exclude a list of values
    {
      ...FACTORIES[WidgetType.Stat](9, 3),
      title: 'NOT IN — Excluding Cancelled & No-Shows',
      config: {
        value: '–', subValue: 'status NOT IN [cancelled, no_show]', trend: '', trendUp: true,
        accent: '#06b6d4', prefix: '', suffix: '',
        description: 'NOT_IN: excludes all rows matching any value in the list — inverse of IN',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filters: [{ entity: 'appointment', field: 'status', operator: FilterOperator.NotIn, values: ['cancelled', 'no_show'] }],
          periodLabel: 'NOT_IN filter',
        },
      },
    },

    // ── Row 5 — IS_NULL · IS_NOT_NULL · CONTAINS · combined ────
    // [IS_NULL] — rows where a nullable field has no value
    {
      ...FACTORIES[WidgetType.Stat](0, 5),
      title: 'IS NULL — No Rating Submitted',
      config: {
        value: '–', subValue: 'rating IS NULL', trend: '', trendUp: false,
        accent: '#6b7280', prefix: '', suffix: '',
        description: 'IS_NULL: selects rows where rating is null — dna, cancelled, booked, and some attended without feedback',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filters: [{ entity: 'appointment_patient', field: 'rating', operator: FilterOperator.IsNull }],
          periodLabel: 'IS NULL filter',
        },
      },
    },
    // [IS_NOT_NULL] — rows where a nullable field has a value
    {
      ...FACTORIES[WidgetType.Stat](3, 5),
      title: 'IS NOT NULL — Rating Submitted',
      config: {
        value: '–', subValue: 'rating IS NOT NULL', trend: '', trendUp: true,
        accent: '#10b981', prefix: '', suffix: '',
        description: 'IS_NOT_NULL: selects rows where rating has a value — sum of IS_NULL + IS_NOT_NULL = 43',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filters: [{ entity: 'appointment_patient', field: 'rating', operator: FilterOperator.IsNotNull }],
          periodLabel: 'IS NOT NULL filter',
        },
      },
    },
    // [CONTAINS] — partial string match
    {
      ...FACTORIES[WidgetType.Stat](6, 5),
      title: 'CONTAINS — Identifiers from 2025',
      config: {
        value: '–', subValue: 'identifier CONTAINS "2025"', trend: '', trendUp: true,
        accent: '#8b5cf6', prefix: '', suffix: '',
        description: 'CONTAINS: case-insensitive partial match — selects all appointments where identifier contains "2025"',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filters: [{ entity: 'appointment', field: 'identifier', operator: FilterOperator.Contains, value: '2025' }],
          periodLabel: 'CONTAINS filter',
        },
      },
    },
    // [AND filterGroup — EQ + IS_NOT_NULL] — explicit AND group
    {
      ...FACTORIES[WidgetType.Stat](9, 5),
      title: 'AND Group — Completed with Rating',
      config: {
        value: '–', subValue: 'status=completed AND rating IS NOT NULL', trend: '', trendUp: true,
        accent: '#ec4899', prefix: '', suffix: '',
        description: 'AND filterGroup: EQ(status=completed) AND IS_NOT_NULL(rating) — both conditions must match (explicit AND logic)',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filterGroups: [{ id: 'g1', logic: 'AND', conditions: [
            { entity: 'appointment',         field: 'status', operator: FilterOperator.Eq,        value: 'completed' },
            { entity: 'appointment_patient', field: 'rating', operator: FilterOperator.IsNotNull },
          ]}],
          periodLabel: 'AND group',
        },
      },
    },

    // ── Section: Filters in Charts & Tables ────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 8),
      title: 'Section',
      config: { label: 'Filters Applied to Charts & Tables', accent: '#ec4899', showLine: true, align: TextAlign.Left },
    },

    // ── Row 9 — EQ filter on bar + GT filter on pie ────────────
    // [EQ in chart] — monthly count of completed appointments only
    {
      ...FACTORIES[WidgetType.Bar](0, 9),
      w: 7, h: 3,
      title: 'EQ Filter — Completed Appointments by Month',
      config: {
        accent: '#10b981', stacked: false, horizontal: false,
        showGrid: true, showLegend: false, series: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          dateAxis: { entity: 'appointment', field: 'start_date', interval: DateInterval.Month },
          valueAgg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filters: [{ entity: 'appointment', field: 'status', operator: FilterOperator.Eq, value: 'completed' }],
          dateRangeField: { entity: 'appointment', field: 'start_date' },
        },
      },
    },
    // [GT in pie] — revenue breakdown for high-value appointments only
    {
      ...FACTORIES[WidgetType.Pie](7, 9),
      w: 5, h: 3,
      title: 'GT Filter — Revenue by Payor (price > £100)',
      config: {
        innerRadius: 50, showLabels: false, showLegend: true, data: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          groupBy: { entity: 'appointment_patient', field: 'payor_type' },
          valueAgg: { entity: 'appointment_patient', field: 'price', function: AggregationFunction.Sum },
          filters: [{ entity: 'appointment_patient', field: 'price', operator: FilterOperator.Gt, value: 100 }],
          dateRangeField: { entity: 'appointment', field: 'start_date' },
        },
      },
    },

    // ── Row 12 — IS_NOT_NULL line + IN filter bar ──────────────
    // [IS_NOT_NULL in chart] — trend of appointments that received a rating
    {
      ...FACTORIES[WidgetType.Line](0, 12),
      w: 6, h: 3,
      title: 'IS NOT NULL — Rated Appointments by Month',
      config: {
        areaFill: false, smooth: true, showGrid: true, showDots: true, showLegend: false,
        series: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          dateAxis: { entity: 'appointment', field: 'start_date', interval: DateInterval.Month },
          valueAgg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filters: [{ entity: 'appointment_patient', field: 'rating', operator: FilterOperator.IsNotNull }],
          dateRangeField: { entity: 'appointment', field: 'start_date' },
        },
      },
    },
    // [IN filter in bar] — completed + confirmed by site
    {
      ...FACTORIES[WidgetType.Bar](6, 12),
      w: 6, h: 3,
      title: 'IN Filter — Completed & Confirmed by Site',
      config: {
        accent: '#22c55e', stacked: false, horizontal: true,
        showGrid: true, showLegend: false, series: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          groupBy: { entity: 'appointment', field: 'site_id' },
          valueAgg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filters: [{ entity: 'appointment', field: 'status', operator: FilterOperator.In, values: ['completed', 'confirmed'] }],
        },
      },
    },

    // ── Row 15 — IN filter table (attended + high-value) ───────
    // [IN + GTE combined table] — appointments that are in progress or attended, with price detail
    {
      ...FACTORIES[WidgetType.Table](0, 15),
      w: 12, h: 3,
      title: 'AND Group — IN + GTE: Active High-Value Appointments',
      config: {
        striped: true, compact: false, statusColumn: true,
        columns: [], rows: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient', 'patient', 'contact'],
          columns: [
            { entity: 'appointment',         field: 'identifier'    },
            { entity: 'appointment',         field: 'start_date'    },
            { entity: 'appointment',         field: 'status'        },
            { entity: 'appointment',         field: 'site_id'       },
            { entity: 'appointment_patient', field: 'payor_type'    },
            { entity: 'appointment_patient', field: 'price'         },
            { entity: 'appointment_patient', field: 'rating'        },
            { entity: 'contact',             field: 'firstname'     },
            { entity: 'contact',             field: 'lastname'      },
          ],
          filterGroups: [{ id: 'g1', logic: 'AND', conditions: [
            { entity: 'appointment',         field: 'status', operator: FilterOperator.In,  values: ['completed', 'confirmed', 'scheduled'] },
            { entity: 'appointment_patient', field: 'price',  operator: FilterOperator.Gte, value: 120 },
          ]}],
          sort: { entity: 'appointment', field: 'start_date', direction: SortDirection.Desc },
          pageSize: 20,
          dateRangeField: { entity: 'appointment', field: 'start_date' },
        },
      },
    },

    // ── Row 18 — IS_NULL vs IS_NOT_NULL nullable field showcase ─
    // [NOT_IN filter table] — exclude dna and cancelled, show with notes
    {
      ...FACTORIES[WidgetType.Table](0, 18),
      w: 12, h: 3,
      title: 'AND Group — NOT_IN + IS_NOT_NULL: Attended with Feedback',
      config: {
        striped: true, compact: true, statusColumn: false,
        columns: [], rows: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          columns: [
            { entity: 'appointment',         field: 'identifier'       },
            { entity: 'appointment',         field: 'start_date'       },
            { entity: 'appointment',         field: 'status'           },
            { entity: 'appointment_patient', field: 'payor_type'       },
            { entity: 'appointment_patient', field: 'price'            },
            { entity: 'appointment_patient', field: 'rating'           },
            { entity: 'appointment_patient', field: 'notes'            },
          ],
          filterGroups: [{ id: 'g1', logic: 'AND', conditions: [
            { entity: 'appointment',         field: 'status', operator: FilterOperator.NotIn,    values: ['cancelled', 'no_show', 'scheduled'] },
            { entity: 'appointment_patient', field: 'rating', operator: FilterOperator.IsNotNull },
          ]}],
          sort: { entity: 'appointment_patient', field: 'rating', direction: SortDirection.Desc },
          pageSize: 20,
          dateRangeField: { entity: 'appointment', field: 'start_date' },
        },
      },
    },
  ];
}


// ───────────────────────────────────────────────────────────────
//  PATIENT ROSTER
//  Demonstrates: multi-entity joins, LEFT JOINs, patient
//  demographics, address/telecom joins, is_primary filter
// ───────────────────────────────────────────────────────────────

function buildPatientRoster(): Widget[] {
  return [
    // ── Section header ─────────────────────────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 0),
      title: 'Section',
      config: { label: 'Patient Roster', accent: '#06b6d4', showLine: true, align: TextAlign.Left },
    },

    // ── Row 1 — 4 stat cards ───────────────────────────────────
    // [COUNT] total patients registered
    {
      ...FACTORIES[WidgetType.Stat](0, 1),
      title: 'Total Patients',
      config: {
        value: '–', subValue: 'all records', trend: '', trendUp: true,
        accent: '#06b6d4', prefix: '', suffix: '',
        description: 'Total patients registered in the system',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['patient'],
          agg: { entity: 'patient', field: 'id', function: AggregationFunction.Count },
          periodLabel: 'All time',
        },
      },
    },
    // [EQ filter] active patients only
    {
      ...FACTORIES[WidgetType.Stat](3, 1),
      title: 'Active Patients',
      config: {
        value: '–', subValue: 'status = active', trend: '', trendUp: true,
        accent: '#22c55e', prefix: '', suffix: '',
        description: 'Patients with status = active — excludes inactive and deceased',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['patient'],
          agg: { entity: 'patient', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'patient', field: 'status', operator: FilterOperator.Eq, value: 'active' }],
          periodLabel: 'Current',
        },
      },
    },
    // [EQ filter] male patients
    {
      ...FACTORIES[WidgetType.Stat](6, 1),
      title: 'Male Patients',
      config: {
        value: '–', subValue: 'sex = M', trend: '', trendUp: true,
        accent: '#3b82f6', prefix: '', suffix: '',
        description: 'Patients where sex = M',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['patient'],
          agg: { entity: 'patient', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'patient', field: 'sex', operator: FilterOperator.Eq, value: 'M' }],
          periodLabel: 'Current',
        },
      },
    },
    // [EQ filter] female patients
    {
      ...FACTORIES[WidgetType.Stat](9, 1),
      title: 'Female Patients',
      config: {
        value: '–', subValue: 'sex = F', trend: '', trendUp: true,
        accent: '#ec4899', prefix: '', suffix: '',
        description: 'Patients where sex = F',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['patient'],
          agg: { entity: 'patient', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'patient', field: 'sex', operator: FilterOperator.Eq, value: 'F' }],
          periodLabel: 'Current',
        },
      },
    },

    // ── Row 3 — patients by sex pie + registration trend bar ───
    // [groupBy + COUNT] — patient breakdown by sex
    {
      ...FACTORIES[WidgetType.Pie](0, 3),
      w: 5, h: 3,
      title: 'Patients by Sex',
      config: {
        innerRadius: 50, showLabels: false, showLegend: true, data: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['patient'],
          groupBy: { entity: 'patient', field: 'sex' },
          valueAgg: { entity: 'patient', field: 'id', function: AggregationFunction.Count },
        },
      },
    },
    // [dateAxis + COUNT] — patient registrations per year
    {
      ...FACTORIES[WidgetType.Bar](5, 3),
      w: 7, h: 3,
      title: 'New Patient Registrations by Year',
      config: {
        accent: '#06b6d4', stacked: false, horizontal: false,
        showGrid: true, showLegend: false, series: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['patient'],
          dateAxis: { entity: 'patient', field: 'created_on', interval: DateInterval.Year },
          valueAgg: { entity: 'patient', field: 'id', function: AggregationFunction.Count },
        },
      },
    },

    // ── Row 6 — analytics + COUNT_DISTINCT unique patients ─────
    // [Analytics trend] — patient registration monthly trend
    {
      ...FACTORIES[WidgetType.Analytics](0, 6),
      w: 4, h: 3,
      title: 'Patient Registration Trend',
      config: {
        value: '–', changeValue: '', changeLabel: 'vs previous period',
        trendUp: true, accent: '#06b6d4', data: [], period: '',
        selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['patient'],
          agg: { entity: 'patient', field: 'id', function: AggregationFunction.Count },
          periodLabel: 'Monthly trend',
          trend: { entity: 'patient', field: 'created_on', interval: DateInterval.Year, periods: 3 },
        },
      },
    },
    // [COUNT_DISTINCT] — patients who have at least one appointment
    {
      ...FACTORIES[WidgetType.Stat](4, 6),
      w: 4, h: 3,
      title: 'Patients with Appointments',
      config: {
        value: '–', subValue: 'COUNT_DISTINCT(patient_id)', trend: '', trendUp: true,
        accent: '#8b5cf6', prefix: '', suffix: '',
        description: 'COUNT_DISTINCT — unique patients who have had at least one appointment',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'patient_id', function: AggregationFunction.CountDistinct },
          periodLabel: 'All time',
        },
      },
    },
    // [NOT_IN filter] — patients not inactive or deceased
    {
      ...FACTORIES[WidgetType.Stat](8, 6),
      w: 4, h: 3,
      title: 'Contactable Patients',
      config: {
        value: '–', subValue: 'NOT IN [inactive, deceased]', trend: '', trendUp: true,
        accent: '#10b981', prefix: '', suffix: '',
        description: 'NOT_IN filter — excludes inactive and deceased patients from count',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['patient'],
          agg: { entity: 'patient', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'patient', field: 'status', operator: FilterOperator.NotIn, values: ['inactive', 'deceased'] }],
          periodLabel: 'Current',
        },
      },
    },

    // ── Section: Patient Contact Details ───────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 9),
      title: 'Section',
      config: { label: 'Patient Contact Details', accent: '#06b6d4', showLine: true, align: TextAlign.Left },
    },

    // ── Row 10 — full patient directory table ──────────────────
    // [Multi-join LEFT] — patient → contact → contact_address → address
    // EC-J3: pat-005 has no address row — address fields will be null (LEFT JOIN)
    {
      ...FACTORIES[WidgetType.Table](0, 10),
      w: 12, h: 3,
      title: 'Patient Directory (with Address)',
      config: {
        striped: true, compact: true, statusColumn: true,
        columns: [], rows: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['patient', 'contact', 'contact_address', 'address'],
          columns: [
            { entity: 'patient',  field: 'mrn'           },
            { entity: 'contact',  field: 'title'         },
            { entity: 'contact',  field: 'firstname'     },
            { entity: 'contact',  field: 'lastname'      },
            { entity: 'patient',  field: 'date_of_birth' },
            { entity: 'patient',  field: 'sex'           },
            { entity: 'patient',  field: 'status'        },
            { entity: 'patient',  field: 'deceased'      },
            { entity: 'address',  field: 'address1'      },
            { entity: 'address',  field: 'address2'      },
            { entity: 'address',  field: 'address3'      },
            { entity: 'address',  field: 'postcode'      },
          ],
          sort: { entity: 'contact', field: 'lastname', direction: SortDirection.Asc },
          pageSize: 20,
        },
      },
    },

    // ── Row 13 — telecom table ─────────────────────────────────
    // [LEFT JOIN + IS_PRIMARY filter] — patient → contact → contact_telecom → telecom
    // EC-J4: pat-001 has two telecom rows (mobile + email) — is_primary=true gives one row per patient
    // EC-J3: pat-008 (Laura) and pat-010 (Helen) have NO telecom rows — LEFT JOIN returns NULLs
    {
      ...FACTORIES[WidgetType.Table](0, 13),
      w: 8, h: 3,
      title: 'Patient Telecoms (Primary Contact)',
      config: {
        striped: true, compact: true, statusColumn: false,
        columns: [], rows: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['patient', 'contact', 'contact_telecom', 'telecom'],
          columns: [
            { entity: 'patient',         field: 'mrn'          },
            { entity: 'contact',         field: 'firstname'    },
            { entity: 'contact',         field: 'lastname'     },
            { entity: 'telecom',         field: 'value'        },
            { entity: 'telecom',         field: 'telecom_type' },
            { entity: 'contact_telecom', field: 'is_primary'   },
          ],
          filters: [
            { entity: 'contact_telecom', field: 'is_primary', operator: FilterOperator.Eq, value: 'true' },
          ],
          sort: { entity: 'contact', field: 'lastname', direction: SortDirection.Asc },
          pageSize: 20,
        },
      },
    },
    // [groupBy + COUNT] — breakdown of telecom types across all patients
    {
      ...FACTORIES[WidgetType.Pie](8, 13),
      w: 4, h: 3,
      title: 'Telecoms by Type',
      config: {
        innerRadius: 0, showLabels: true, showLegend: true, data: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['patient', 'contact', 'contact_telecom', 'telecom'],
          groupBy: { entity: 'telecom', field: 'telecom_type' },
          valueAgg: { entity: 'patient', field: 'id', function: AggregationFunction.Count },
        },
      },
    },
  ];
}


// ───────────────────────────────────────────────────────────────
//  APPOINTMENT QUALITY & SATISFACTION
//  Demonstrates: AVG/MIN/MAX on nullable rating, IS_NULL,
//  IS_NOT_NULL, boolean filters (is_remote), multi-join to
//  contact for patient name, combined filters
// ───────────────────────────────────────────────────────────────

function buildAppointmentQuality(): Widget[] {
  return [
    // ── Section header ─────────────────────────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 0),
      title: 'Section',
      config: { label: 'Appointment Quality & Satisfaction', accent: '#f97316', showLine: true, align: TextAlign.Left },
    },

    // ── Row 1 — 4 rating/feedback stat cards ───────────────────
    // [AVG on nullable] — average rating, null rows excluded automatically
    {
      ...FACTORIES[WidgetType.Stat](0, 1),
      title: 'AVG Patient Rating',
      config: {
        value: '–', subValue: 'AVG(rating)', trend: '', trendUp: true,
        accent: '#f97316', prefix: '', suffix: ' / 5',
        description: 'Average patient satisfaction rating — null rows (dna/cancelled) excluded',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'rating', function: AggregationFunction.Avg },
          periodLabel: 'Rated appointments',
        },
      },
    },
    // [IS_NOT_NULL] — how many appointments received a rating
    {
      ...FACTORIES[WidgetType.Stat](3, 1),
      title: 'Ratings Submitted',
      config: {
        value: '–', subValue: 'rating IS NOT NULL', trend: '', trendUp: true,
        accent: '#10b981', prefix: '', suffix: '',
        description: 'IS_NOT_NULL filter — appointments where a rating was submitted by the patient',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filters: [{ entity: 'appointment_patient', field: 'rating', operator: FilterOperator.IsNotNull }],
          periodLabel: 'IS NOT NULL',
        },
      },
    },
    // [IS_NULL] — appointments with no rating yet
    {
      ...FACTORIES[WidgetType.Stat](6, 1),
      title: 'No Feedback Submitted',
      config: {
        value: '–', subValue: 'rating IS NULL', trend: '', trendUp: false,
        accent: '#6b7280', prefix: '', suffix: '',
        description: 'IS_NULL filter — dna, cancelled, booked and some attended rows with no rating',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filters: [{ entity: 'appointment_patient', field: 'rating', operator: FilterOperator.IsNull }],
          periodLabel: 'IS NULL',
        },
      },
    },
    // [EQ + IS_NOT_NULL combined] — completed appointments that also have a rating
    {
      ...FACTORIES[WidgetType.Stat](9, 1),
      title: 'Completed with Rating',
      config: {
        value: '–', subValue: 'completed AND rating IS NOT NULL', trend: '', trendUp: true,
        accent: '#ec4899', prefix: '', suffix: '',
        description: 'AND filterGroup: EQ(status=completed) AND IS_NOT_NULL(rating) — explicit AND group, both conditions must be true',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filterGroups: [{ id: 'g1', logic: 'AND', conditions: [
            { entity: 'appointment',         field: 'status', operator: FilterOperator.Eq,        value: 'completed' },
            { entity: 'appointment_patient', field: 'rating', operator: FilterOperator.IsNotNull },
          ]}],
          periodLabel: 'AND group',
        },
      },
    },

    // ── Row 3 — avg rating by payor bar + rated by month line ──
    // [AVG grouped] — avg satisfaction split by who paid
    {
      ...FACTORIES[WidgetType.Bar](0, 3),
      w: 6, h: 3,
      title: 'AVG Rating by Payor Type',
      config: {
        accent: '#f97316', stacked: false, horizontal: true,
        showGrid: true, showLegend: false, series: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          groupBy: { entity: 'appointment_patient', field: 'payor_type' },
          valueAgg: { entity: 'appointment_patient', field: 'rating', function: AggregationFunction.Avg },
        },
      },
    },
    // [IS_NOT_NULL in chart] — monthly trend of rated appointments
    {
      ...FACTORIES[WidgetType.Line](6, 3),
      w: 6, h: 3,
      title: 'Rated Appointments by Month',
      config: {
        areaFill: false, smooth: true, showGrid: true, showDots: true, showLegend: false,
        series: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          dateAxis: { entity: 'appointment', field: 'start_date', interval: DateInterval.Month },
          valueAgg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filters: [{ entity: 'appointment_patient', field: 'rating', operator: FilterOperator.IsNotNull }],
          dateRangeField: { entity: 'appointment', field: 'start_date' },
        },
      },
    },

    // ── Section: Remote vs In-Person ───────────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 6),
      title: 'Section',
      config: { label: 'Remote vs In-Person', accent: '#f97316', showLine: true, align: TextAlign.Left },
    },

    // ── Row 7 — 4 remote/in-person stat cards ──────────────────
    // [EQ boolean = true] — remote appointments
    {
      ...FACTORIES[WidgetType.Stat](0, 7),
      title: 'Remote Appointments',
      config: {
        value: '–', subValue: 'is_remote = true', trend: '', trendUp: true,
        accent: '#8b5cf6', prefix: '', suffix: '',
        description: 'EQ filter on boolean field: appointments delivered via video consultation',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filters: [{ entity: 'appointment', field: 'is_remote', operator: FilterOperator.Eq, value: 'true' }],
          periodLabel: 'Remote',
        },
      },
    },
    // [EQ boolean = false] — in-person appointments
    {
      ...FACTORIES[WidgetType.Stat](3, 7),
      title: 'In-Person Appointments',
      config: {
        value: '–', subValue: 'is_remote = false', trend: '', trendUp: true,
        accent: '#3b82f6', prefix: '', suffix: '',
        description: 'EQ filter on boolean field = false: in-clinic appointments only',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filters: [{ entity: 'appointment', field: 'is_remote', operator: FilterOperator.Eq, value: 'false' }],
          periodLabel: 'In-person',
        },
      },
    },
    // [AVG + EQ boolean] — avg duration for remote appointments
    {
      ...FACTORIES[WidgetType.Stat](6, 7),
      title: 'Avg Duration — Remote',
      config: {
        value: '–', subValue: 'AVG(duration_minutes) remote', trend: '', trendUp: true,
        accent: '#a78bfa', prefix: '', suffix: ' min',
        description: 'AVG duration for remote/video appointments — filtered by is_remote=true',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment'],
          agg: { entity: 'appointment', field: 'duration_minutes', function: AggregationFunction.Avg },
          filters: [{ entity: 'appointment', field: 'is_remote', operator: FilterOperator.Eq, value: 'true' }],
          periodLabel: 'Remote avg',
        },
      },
    },
    // [AVG + EQ boolean] — avg duration for in-person appointments
    {
      ...FACTORIES[WidgetType.Stat](9, 7),
      title: 'Avg Duration — In-Person',
      config: {
        value: '–', subValue: 'AVG(duration_minutes) in-person', trend: '', trendUp: true,
        accent: '#06b6d4', prefix: '', suffix: ' min',
        description: 'AVG duration for in-person appointments — filtered by is_remote=false',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment'],
          agg: { entity: 'appointment', field: 'duration_minutes', function: AggregationFunction.Avg },
          filters: [{ entity: 'appointment', field: 'is_remote', operator: FilterOperator.Eq, value: 'false' }],
          periodLabel: 'In-person avg',
        },
      },
    },

    // ── Row 9 — attendance status pie + invoiced bar ────────────
    // [groupBy] — appointment_patient.status breakdown
    {
      ...FACTORIES[WidgetType.Pie](0, 9),
      w: 5, h: 3,
      title: 'Patient Attendance Status',
      config: {
        innerRadius: 50, showLabels: false, showLegend: true, data: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          groupBy: { entity: 'appointment_patient', field: 'status' },
          valueAgg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
        },
      },
    },
    // [EQ boolean] — invoiced vs not invoiced bar
    {
      ...FACTORIES[WidgetType.Bar](5, 9),
      w: 7, h: 3,
      title: 'Invoiced Appointments by Month',
      config: {
        accent: '#10b981', stacked: false, horizontal: false,
        showGrid: true, showLegend: false, series: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          dateAxis: { entity: 'appointment', field: 'start_date', interval: DateInterval.Month },
          valueAgg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filters: [{ entity: 'appointment', field: 'invoiced', operator: FilterOperator.Eq, value: 'true' }],
          dateRangeField: { entity: 'appointment', field: 'start_date' },
        },
      },
    },

    // ── Row 12 — top rated appointments table ──────────────────
    // [IS_NOT_NULL + sort by rating DESC] — appointments with feedback, best first
    {
      ...FACTORIES[WidgetType.Table](0, 12),
      w: 12, h: 3,
      title: 'Top-Rated Appointments with Patient Feedback',
      config: {
        striped: true, compact: false, statusColumn: true,
        columns: [], rows: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient', 'patient', 'contact'],
          columns: [
            { entity: 'appointment',         field: 'identifier'       },
            { entity: 'appointment',         field: 'start_date'       },
            { entity: 'appointment',         field: 'status'           },
            { entity: 'appointment',         field: 'is_remote'        },
            { entity: 'appointment',         field: 'duration_minutes' },
            { entity: 'appointment',         field: 'site_id'          },
            { entity: 'appointment_patient', field: 'payor_type'       },
            { entity: 'appointment_patient', field: 'price'            },
            { entity: 'appointment_patient', field: 'rating'           },
            { entity: 'appointment_patient', field: 'notes'            },
            { entity: 'contact',             field: 'firstname'        },
            { entity: 'contact',             field: 'lastname'         },
          ],
          filters: [
            { entity: 'appointment_patient', field: 'rating', operator: FilterOperator.IsNotNull },
          ],
          sort: { entity: 'appointment_patient', field: 'rating', direction: SortDirection.Desc },
          pageSize: 20,
          dateRangeField: { entity: 'appointment', field: 'start_date' },
        },
      },
    },
  ];
}


// ───────────────────────────────────────────────────────────────
//  SITE PERFORMANCE
//  Demonstrates: EQ filter on site_id, groupBy site, cross-site
//  aggregations (SUM/AVG/COUNT per site), multi-entity joins,
//  boolean invoiced/is_remote fields in context
// ───────────────────────────────────────────────────────────────

function buildSitePerformance(): Widget[] {
  return [
    // ── Section header ─────────────────────────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 0),
      title: 'Section',
      config: { label: 'Site Performance', accent: '#f59e0b', showLine: true, align: TextAlign.Left },
    },

    // ── Row 1 — 4 per-site appointment stat cards ───────────────
    // [EQ on site_id] — each card filters to a single site
    {
      ...FACTORIES[WidgetType.Stat](0, 1),
      title: 'SITE-001 Appointments',
      config: {
        value: '–', subValue: 'site_id = SITE-001', trend: '', trendUp: true,
        accent: '#3b82f6', prefix: '', suffix: '',
        description: 'EQ filter: total appointments at SITE-001',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filters: [{ entity: 'appointment', field: 'site_id', operator: FilterOperator.Eq, value: 'SITE-001' }],
          periodLabel: 'All time',
        },
      },
    },
    {
      ...FACTORIES[WidgetType.Stat](3, 1),
      title: 'SITE-002 Appointments',
      config: {
        value: '–', subValue: 'site_id = SITE-002', trend: '', trendUp: true,
        accent: '#10b981', prefix: '', suffix: '',
        description: 'EQ filter: total appointments at SITE-002',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filters: [{ entity: 'appointment', field: 'site_id', operator: FilterOperator.Eq, value: 'SITE-002' }],
          periodLabel: 'All time',
        },
      },
    },
    {
      ...FACTORIES[WidgetType.Stat](6, 1),
      title: 'SITE-003 Appointments',
      config: {
        value: '–', subValue: 'site_id = SITE-003', trend: '', trendUp: true,
        accent: '#a78bfa', prefix: '', suffix: '',
        description: 'EQ filter: total appointments at SITE-003',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filters: [{ entity: 'appointment', field: 'site_id', operator: FilterOperator.Eq, value: 'SITE-003' }],
          periodLabel: 'All time',
        },
      },
    },
    // [SUM filtered] — total revenue across all sites
    {
      ...FACTORIES[WidgetType.Stat](9, 1),
      title: 'Total Revenue All Sites',
      config: {
        value: '–', subValue: 'SUM(price) all sites', trend: '', trendUp: true,
        accent: '#f59e0b', prefix: '£', suffix: '',
        description: 'SUM aggregation across all sites — no site filter applied',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'price', function: AggregationFunction.Sum },
          periodLabel: 'All time',
        },
      },
    },

    // ── Row 3 — appointments by site bar + revenue by site pie ─
    // [groupBy site_id + COUNT]
    {
      ...FACTORIES[WidgetType.Bar](0, 3),
      w: 6, h: 3,
      title: 'Appointments per Site',
      config: {
        accent: '#f59e0b', stacked: false, horizontal: true,
        showGrid: true, showLegend: false, series: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          groupBy: { entity: 'appointment', field: 'site_id' },
          valueAgg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
        },
      },
    },
    // [groupBy site_id + SUM]
    {
      ...FACTORIES[WidgetType.Pie](6, 3),
      w: 6, h: 3,
      title: 'Revenue Share by Site',
      config: {
        innerRadius: 50, showLabels: false, showLegend: true, data: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          groupBy: { entity: 'appointment', field: 'site_id' },
          valueAgg: { entity: 'appointment_patient', field: 'price', function: AggregationFunction.Sum },
        },
      },
    },

    // ── Row 6 — avg price per site bar + avg duration per site ─
    // [AVG grouped by site]
    {
      ...FACTORIES[WidgetType.Bar](0, 6),
      w: 6, h: 3,
      title: 'AVG Consultation Price per Site',
      config: {
        accent: '#10b981', stacked: false, horizontal: true,
        showGrid: true, showLegend: false, series: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          groupBy: { entity: 'appointment', field: 'site_id' },
          valueAgg: { entity: 'appointment_patient', field: 'price', function: AggregationFunction.Avg },
        },
      },
    },
    // [AVG grouped by site]
    {
      ...FACTORIES[WidgetType.Bar](6, 6),
      w: 6, h: 3,
      title: 'AVG Appointment Duration per Site',
      config: {
        accent: '#8b5cf6', stacked: false, horizontal: true,
        showGrid: true, showLegend: false, series: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment'],
          groupBy: { entity: 'appointment', field: 'site_id' },
          valueAgg: { entity: 'appointment', field: 'duration_minutes', function: AggregationFunction.Avg },
        },
      },
    },

    // ── Section: Monthly Cross-Site Trends ─────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 9),
      title: 'Section',
      config: { label: 'Monthly Cross-Site Trends', accent: '#f59e0b', showLine: true, align: TextAlign.Left },
    },

    // ── Row 10 — monthly appointment trend + analytics ──────────
    // [dateAxis + groupBy = multi-series] — each site as a series
    {
      ...FACTORIES[WidgetType.Line](0, 10),
      w: 8, h: 3,
      title: 'Monthly Appointments by Site (Multi-Series)',
      config: {
        areaFill: false, smooth: true, showGrid: true, showDots: false, showLegend: true,
        series: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          dateAxis: { entity: 'appointment', field: 'start_date', interval: DateInterval.Month },
          groupBy:  { entity: 'appointment', field: 'site_id' },
          valueAgg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          dateRangeField: { entity: 'appointment', field: 'start_date' },
        },
      },
    },
    // [Analytics trend] — total revenue trend with spark
    {
      ...FACTORIES[WidgetType.Analytics](8, 10),
      w: 4, h: 3,
      title: 'Revenue Trend (All Sites)',
      config: {
        value: '–', changeValue: '', changeLabel: 'vs previous period',
        trendUp: true, accent: '#f59e0b', data: [], period: '',
        selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'price', function: AggregationFunction.Sum },
          periodLabel: 'Monthly trend',
          trend: { entity: 'appointment', field: 'start_date', interval: DateInterval.Month, periods: 12 },
        },
      },
    },

    // ── Row 13 — full appointment detail table with site ────────
    // [Full detail table] — all fields relevant for site analysis
    {
      ...FACTORIES[WidgetType.Table](0, 13),
      w: 12, h: 3,
      title: 'Appointment Detail — All Sites',
      config: {
        striped: true, compact: false, statusColumn: true,
        columns: [], rows: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient', 'patient', 'contact'],
          columns: [
            { entity: 'appointment',         field: 'identifier'       },
            { entity: 'appointment',         field: 'start_date'       },
            { entity: 'appointment',         field: 'site_id'          },
            { entity: 'appointment',         field: 'status'           },
            { entity: 'appointment',         field: 'is_remote'        },
            { entity: 'appointment',         field: 'invoiced'         },
            { entity: 'appointment',         field: 'duration_minutes' },
            { entity: 'appointment_patient', field: 'payor_type'       },
            { entity: 'appointment_patient', field: 'price'            },
            { entity: 'appointment_patient', field: 'status'           },
            { entity: 'appointment_patient', field: 'rating'           },
            { entity: 'contact',             field: 'firstname'        },
            { entity: 'contact',             field: 'lastname'         },
          ],
          sort: { entity: 'appointment', field: 'start_date', direction: SortDirection.Desc },
          pageSize: 20,
          dateRangeField: { entity: 'appointment', field: 'start_date' },
        },
      },
    },
  ];
}


// ───────────────────────────────────────────────────────────────
//  ACCOUNTING AGGREGATION FUNCTIONS SHOWCASE
//  COUNT, COUNT_DISTINCT, SUM, AVG, MIN, MAX on invoice/payment/
//  claim entities. write_off_amount (nullable) plays the same
//  role as rating in EPX — demonstrating AVG/MIN/MAX on a field
//  that is NULL for most rows.
// ───────────────────────────────────────────────────────────────

function buildAccountingAggregations(): Widget[] {
  return [
    // ── Section header ─────────────────────────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 0),
      title: 'Section',
      config: { label: 'Accounting — Aggregation Functions Showcase', accent: '#6366f1', showLine: true, align: TextAlign.Left },
    },

    // ── Row 1 — COUNT · COUNT_DISTINCT · SUM · AVG ─────────────
    // [COUNT] — total invoices
    {
      ...FACTORIES[WidgetType.Stat](0, 1),
      title: 'COUNT — Total Invoices',
      config: {
        value: '–', subValue: 'COUNT(invoice.id)', trend: '', trendUp: true,
        accent: '#6366f1', prefix: '', suffix: '',
        description: 'COUNT: counts every invoice row — expected 35',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'id', function: AggregationFunction.Count },
          periodLabel: 'All records',
        },
      },
    },
    // [COUNT_DISTINCT] — unique payers across all claims
    {
      ...FACTORIES[WidgetType.Stat](3, 1),
      title: 'COUNT DISTINCT — Unique Payers',
      config: {
        value: '–', subValue: 'COUNT_DISTINCT(payer_id)', trend: '', trendUp: true,
        accent: '#8b5cf6', prefix: '', suffix: '',
        description: 'COUNT_DISTINCT: deduplicates payer across claims — many claims share the same payer',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice', 'claim', 'payer'],
          agg: { entity: 'payer', field: 'id', function: AggregationFunction.CountDistinct },
          periodLabel: 'All records',
        },
      },
    },
    // [SUM] — total invoiced revenue
    {
      ...FACTORIES[WidgetType.Stat](6, 1),
      title: 'SUM — Total Invoiced Amount',
      config: {
        value: '–', subValue: 'SUM(total_amount)', trend: '', trendUp: true,
        accent: '#10b981', prefix: '£', suffix: '',
        description: 'SUM: adds all invoice total_amount values across all rows',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'total_amount', function: AggregationFunction.Sum },
          periodLabel: 'All records',
        },
      },
    },
    // [AVG] — mean invoice amount
    {
      ...FACTORIES[WidgetType.Stat](9, 1),
      title: 'AVG — Mean Invoice Amount',
      config: {
        value: '–', subValue: 'AVG(total_amount)', trend: '', trendUp: true,
        accent: '#f59e0b', prefix: '£', suffix: '',
        description: 'AVG: arithmetic mean of total_amount — includes void invoices (£0 or low amounts)',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'total_amount', function: AggregationFunction.Avg },
          periodLabel: 'All records',
        },
      },
    },

    // ── Row 2 — MIN · MAX · AVG nullable · SUM payments ────────
    // [MIN] — lowest invoice amount
    {
      ...FACTORIES[WidgetType.Stat](0, 2),
      title: 'MIN — Smallest Invoice',
      config: {
        value: '–', subValue: 'MIN(total_amount)', trend: '', trendUp: false,
        accent: '#06b6d4', prefix: '£', suffix: '',
        description: 'MIN: smallest total_amount in the dataset',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'total_amount', function: AggregationFunction.Min },
          periodLabel: 'All records',
        },
      },
    },
    // [MAX] — highest invoice amount
    {
      ...FACTORIES[WidgetType.Stat](3, 2),
      title: 'MAX — Largest Invoice',
      config: {
        value: '–', subValue: 'MAX(total_amount)', trend: '', trendUp: true,
        accent: '#ef4444', prefix: '£', suffix: '',
        description: 'MAX: largest total_amount — highest-value invoice in the set',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'total_amount', function: AggregationFunction.Max },
          periodLabel: 'All records',
        },
      },
    },
    // [AVG on nullable] — avg write-off amount (null for most invoices)
    {
      ...FACTORIES[WidgetType.Stat](6, 2),
      title: 'AVG — Write-Off Amount (nulls skipped)',
      config: {
        value: '–', subValue: 'AVG(write_off_amount)', trend: '', trendUp: false,
        accent: '#f97316', prefix: '£', suffix: '',
        description: 'AVG on nullable field: write_off_amount is NULL for most invoices — only 3 rows have a value; nulls are excluded from the average',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'write_off_amount', function: AggregationFunction.Avg },
          periodLabel: 'Written-off only',
        },
      },
    },
    // [SUM on payments] — total cleared payment amount
    {
      ...FACTORIES[WidgetType.Stat](9, 2),
      title: 'SUM — Cleared Payments',
      config: {
        value: '–', subValue: 'SUM(payment.amount) cleared', trend: '', trendUp: true,
        accent: '#22c55e', prefix: '£', suffix: '',
        description: 'SUM on payment entity: adds all cleared payment amounts — different from invoice SUM due to partial payments',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice', 'payment_allocation', 'payment'],
          agg: { entity: 'payment', field: 'amount', function: AggregationFunction.Sum },
          filters: [{ entity: 'payment', field: 'status', operator: FilterOperator.Eq, value: 'cleared' }],
          periodLabel: 'Cleared payments',
        },
      },
    },

    // ── Row 4 — COUNT by month bar + SUM by invoice type pie ───
    // [COUNT in chart] — invoices raised per month
    {
      ...FACTORIES[WidgetType.Bar](0, 4),
      w: 7, h: 3,
      title: 'COUNT — Invoices by Month',
      config: {
        accent: '#6366f1', stacked: false, horizontal: false,
        showGrid: true, showLegend: false, series: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          dateAxis: { entity: 'invoice', field: 'invoice_date', interval: DateInterval.Month },
          valueAgg: { entity: 'invoice', field: 'id', function: AggregationFunction.Count },
          dateRangeField: { entity: 'invoice', field: 'invoice_date' },
        },
      },
    },
    // [SUM grouped by invoice_type] — revenue split by service category
    {
      ...FACTORIES[WidgetType.Pie](7, 4),
      w: 5, h: 3,
      title: 'SUM — Revenue by Invoice Type',
      config: {
        innerRadius: 50, showLabels: false, showLegend: true, data: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          groupBy: { entity: 'invoice', field: 'invoice_type' },
          valueAgg: { entity: 'invoice', field: 'total_amount', function: AggregationFunction.Sum },
          dateRangeField: { entity: 'invoice', field: 'invoice_date' },
        },
      },
    },

    // ── Row 7 — AVG trend analytics + invoice detail table ─────
    // [AVG in analytics] — average invoice value trend over months
    {
      ...FACTORIES[WidgetType.Analytics](0, 7),
      w: 4, h: 3,
      title: 'AVG Invoice Amount — Monthly Trend',
      config: {
        value: '–', changeValue: '', changeLabel: 'vs previous period',
        trendUp: true, accent: '#f59e0b', data: [], period: '',
        selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'total_amount', function: AggregationFunction.Avg },
          periodLabel: 'Monthly avg',
          trend: { entity: 'invoice', field: 'invoice_date', interval: DateInterval.Month, periods: 12 },
        },
      },
    },
    // [Table] — invoices with all aggregatable fields visible
    {
      ...FACTORIES[WidgetType.Table](4, 7),
      w: 8, h: 3,
      title: 'Invoices — Amounts & Write-Offs',
      config: {
        striped: true, compact: false, statusColumn: true,
        columns: [], rows: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          columns: [
            { entity: 'invoice', field: 'invoice_number'   },
            { entity: 'invoice', field: 'invoice_date'     },
            { entity: 'invoice', field: 'status'           },
            { entity: 'invoice', field: 'invoice_type'     },
            { entity: 'invoice', field: 'total_amount'     },
            { entity: 'invoice', field: 'paid_amount'      },
            { entity: 'invoice', field: 'write_off_amount' },
            { entity: 'invoice', field: 'site_id'          },
          ],
          sort: { entity: 'invoice', field: 'invoice_date', direction: SortDirection.Desc },
          pageSize: 20,
          dateRangeField: { entity: 'invoice', field: 'invoice_date' },
        },
      },
    },

    // ── Section: Grouped Aggregations ──────────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 10),
      title: 'Section',
      config: { label: 'Grouped Aggregations', accent: '#6366f1', showLine: true, align: TextAlign.Left },
    },

    // ── Row 11 — COUNT grouped by status + AVG by site ─────────
    // [COUNT grouped by status] — invoices split by status
    {
      ...FACTORIES[WidgetType.Bar](0, 11),
      w: 6, h: 3,
      title: 'COUNT — Invoices by Status',
      config: {
        accent: '#6366f1', stacked: false, horizontal: true,
        showGrid: true, showLegend: false, series: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          groupBy: { entity: 'invoice', field: 'status' },
          valueAgg: { entity: 'invoice', field: 'id', function: AggregationFunction.Count },
        },
      },
    },
    // [AVG grouped by site] — average invoice value per site
    {
      ...FACTORIES[WidgetType.Bar](6, 11),
      w: 6, h: 3,
      title: 'AVG — Invoice Amount per Site',
      config: {
        accent: '#f59e0b', stacked: false, horizontal: true,
        showGrid: true, showLegend: false, series: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          groupBy: { entity: 'invoice', field: 'site_id' },
          valueAgg: { entity: 'invoice', field: 'total_amount', function: AggregationFunction.Avg },
        },
      },
    },

    // ── Row 14 — SUM revenue trend line + claim MIN/MAX stats ──
    // [SUM over time] — monthly revenue as a line chart
    {
      ...FACTORIES[WidgetType.Line](0, 14),
      w: 7, h: 3,
      title: 'SUM — Revenue Trend by Month',
      config: {
        areaFill: true, smooth: true, showGrid: true, showDots: false, showLegend: false,
        series: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          dateAxis: { entity: 'invoice', field: 'invoice_date', interval: DateInterval.Month },
          valueAgg: { entity: 'invoice', field: 'total_amount', function: AggregationFunction.Sum },
          dateRangeField: { entity: 'invoice', field: 'invoice_date' },
        },
      },
    },
    // [COUNT_DISTINCT grouped] — distinct invoice_types per site
    {
      ...FACTORIES[WidgetType.Pie](7, 14),
      w: 5, h: 3,
      title: 'COUNT — Claims by Status',
      config: {
        innerRadius: 0, showLabels: true, showLegend: true, data: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice', 'claim'],
          groupBy: { entity: 'claim', field: 'status' },
          valueAgg: { entity: 'claim', field: 'id', function: AggregationFunction.Count },
        },
      },
    },

    // ── Row 17 — MIN/MAX/SUM stat cards on write_off + claims ──
    // [MIN on nullable write_off_amount]
    {
      ...FACTORIES[WidgetType.Stat](0, 17),
      title: 'MIN — Smallest Write-Off',
      config: {
        value: '–', subValue: 'MIN(write_off_amount)', trend: '', trendUp: false,
        accent: '#06b6d4', prefix: '£', suffix: '',
        description: 'MIN on nullable write_off_amount — only 3 rows have a value; nulls excluded automatically',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'write_off_amount', function: AggregationFunction.Min },
          periodLabel: 'Written-off only',
        },
      },
    },
    // [MAX on nullable write_off_amount]
    {
      ...FACTORIES[WidgetType.Stat](3, 17),
      title: 'MAX — Largest Write-Off',
      config: {
        value: '–', subValue: 'MAX(write_off_amount)', trend: '', trendUp: false,
        accent: '#ef4444', prefix: '£', suffix: '',
        description: 'MAX on nullable write_off_amount — expected £150.00 (inv-023 full bad debt); nulls excluded',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'write_off_amount', function: AggregationFunction.Max },
          periodLabel: 'Written-off only',
        },
      },
    },
    // [SUM write_off_amount] — total bad debt written off
    {
      ...FACTORIES[WidgetType.Stat](6, 17),
      title: 'SUM — Total Written Off',
      config: {
        value: '–', subValue: 'SUM(write_off_amount)', trend: '', trendUp: false,
        accent: '#f97316', prefix: '£', suffix: '',
        description: 'SUM on write_off_amount — total bad debt across all invoices; nulls treated as 0 in SUM',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'write_off_amount', function: AggregationFunction.Sum },
          periodLabel: 'All records',
        },
      },
    },
    // [AVG claimed_amount] — mean claim value
    {
      ...FACTORIES[WidgetType.Stat](9, 17),
      title: 'AVG — Mean Claim Amount',
      config: {
        value: '–', subValue: 'AVG(claimed_amount)', trend: '', trendUp: true,
        accent: '#3b82f6', prefix: '£', suffix: '',
        description: 'AVG on claim.claimed_amount — arithmetic mean across all claims regardless of status',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice', 'claim'],
          agg: { entity: 'claim', field: 'claimed_amount', function: AggregationFunction.Avg },
          periodLabel: 'All claims',
        },
      },
    },

    // ── Row 19 — SUM revenue grouped by invoice_type bar ───────
    // [SUM grouped + non-null filter] — revenue by invoice type for non-void invoices
    {
      ...FACTORIES[WidgetType.Bar](0, 19),
      w: 12, h: 3,
      title: 'SUM Revenue by Invoice Type (non-void)',
      config: {
        accent: '#10b981', stacked: false, horizontal: false,
        showGrid: true, showLegend: false, series: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          groupBy: { entity: 'invoice', field: 'invoice_type' },
          valueAgg: { entity: 'invoice', field: 'total_amount', function: AggregationFunction.Sum },
          filters: [{ entity: 'invoice', field: 'is_void', operator: FilterOperator.Eq, value: 'false' }],
        },
      },
    },
  ];
}


// ───────────────────────────────────────────────────────────────
//  ACCOUNTING FILTER OPERATIONS SHOWCASE
//  eq, neq, gt, gte, lt, lte, is_null, is_not_null,
//  in, not_in, contains — one widget per operator, using
//  invoice/payment/claim entities.
// ───────────────────────────────────────────────────────────────

function buildAccountingFilterOps(): Widget[] {
  return [
    // ── Section header ─────────────────────────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 0),
      title: 'Section',
      config: { label: 'Accounting — Filter Operations Showcase', accent: '#ec4899', showLine: true, align: TextAlign.Left },
    },

    // ── Row 1 — EQ · NEQ · GT · GTE ───────────────────────────
    // [EQ] — exact status match
    {
      ...FACTORIES[WidgetType.Stat](0, 1),
      title: 'EQ — Paid Invoices',
      config: {
        value: '–', subValue: 'status = "paid"', trend: '', trendUp: true,
        accent: '#10b981', prefix: '', suffix: '',
        description: 'EQ (=): filters invoices where status exactly equals "paid"',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'invoice', field: 'status', operator: FilterOperator.Eq, value: 'paid' }],
          periodLabel: 'EQ filter',
        },
      },
    },
    // [NEQ] — not void
    {
      ...FACTORIES[WidgetType.Stat](3, 1),
      title: 'NEQ — Excluding Void Invoices',
      config: {
        value: '–', subValue: 'is_void != true', trend: '', trendUp: true,
        accent: '#3b82f6', prefix: '', suffix: '',
        description: 'NEQ (!=): excludes void invoices — all active invoice records',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'invoice', field: 'is_void', operator: FilterOperator.Neq, value: 'true' }],
          periodLabel: 'NEQ filter',
        },
      },
    },
    // [GT] — invoices above a threshold
    {
      ...FACTORIES[WidgetType.Stat](6, 1),
      title: 'GT — Invoices > £200',
      config: {
        value: '–', subValue: 'total_amount > 200', trend: '', trendUp: true,
        accent: '#f59e0b', prefix: '', suffix: '',
        description: 'GT (>): only invoices where total_amount is strictly greater than 200',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'invoice', field: 'total_amount', operator: FilterOperator.Gt, value: 200 }],
          periodLabel: 'GT filter',
        },
      },
    },
    // [GTE] — invoices at or above threshold
    {
      ...FACTORIES[WidgetType.Stat](9, 1),
      title: 'GTE — Invoices >= £300',
      config: {
        value: '–', subValue: 'total_amount >= 300', trend: '', trendUp: true,
        accent: '#a78bfa', prefix: '', suffix: '',
        description: 'GTE (>=): includes invoices where total_amount is exactly 300 or above',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'invoice', field: 'total_amount', operator: FilterOperator.Gte, value: 300 }],
          periodLabel: 'GTE filter',
        },
      },
    },

    // ── Row 3 — LT · LTE · IN · NOT_IN ────────────────────────
    // [LT] — small invoices
    {
      ...FACTORIES[WidgetType.Stat](0, 3),
      title: 'LT — Invoices < £100',
      config: {
        value: '–', subValue: 'total_amount < 100', trend: '', trendUp: false,
        accent: '#ef4444', prefix: '', suffix: '',
        description: 'LT (<): only invoices where total_amount is less than 100 — captures low-value billings',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'invoice', field: 'total_amount', operator: FilterOperator.Lt, value: 100 }],
          periodLabel: 'LT filter',
        },
      },
    },
    // [LTE] — invoices at or below threshold
    {
      ...FACTORIES[WidgetType.Stat](3, 3),
      title: 'LTE — Invoices <= £150',
      config: {
        value: '–', subValue: 'total_amount <= 150', trend: '', trendUp: false,
        accent: '#f97316', prefix: '', suffix: '',
        description: 'LTE (<=): includes exactly £150 invoices — compare count with LT < 100',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'invoice', field: 'total_amount', operator: FilterOperator.Lte, value: 150 }],
          periodLabel: 'LTE filter',
        },
      },
    },
    // [IN] — multiple invoice types
    {
      ...FACTORIES[WidgetType.Stat](6, 3),
      title: 'IN — Consultation or Procedure',
      config: {
        value: '–', subValue: 'invoice_type IN [consultation, procedure]', trend: '', trendUp: true,
        accent: '#22c55e', prefix: '', suffix: '',
        description: 'IN: matches any invoice where invoice_type is in the provided list — equivalent to EQ OR EQ',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'invoice', field: 'invoice_type', operator: FilterOperator.In, values: ['consultation', 'procedure'] }],
          periodLabel: 'IN filter',
        },
      },
    },
    // [NOT_IN] — exclude certain types
    {
      ...FACTORIES[WidgetType.Stat](9, 3),
      title: 'NOT IN — Excl. NHS & Insurance Auth',
      config: {
        value: '–', subValue: 'invoice_type NOT IN [nhs, insurance_auth]', trend: '', trendUp: true,
        accent: '#06b6d4', prefix: '', suffix: '',
        description: 'NOT_IN: excludes NHS and insurance_auth invoice types — all private billing only',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'invoice', field: 'invoice_type', operator: FilterOperator.NotIn, values: ['nhs', 'insurance_auth'] }],
          periodLabel: 'NOT_IN filter',
        },
      },
    },

    // ── Row 5 — IS_NULL · IS_NOT_NULL · CONTAINS · combined ────
    // [IS_NULL] — invoices with no write-off
    {
      ...FACTORIES[WidgetType.Stat](0, 5),
      title: 'IS NULL — No Write-Off',
      config: {
        value: '–', subValue: 'write_off_amount IS NULL', trend: '', trendUp: true,
        accent: '#6b7280', prefix: '', suffix: '',
        description: 'IS_NULL: selects invoices where write_off_amount is null — the vast majority of invoices have no bad debt',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'invoice', field: 'write_off_amount', operator: FilterOperator.IsNull }],
          periodLabel: 'IS NULL filter',
        },
      },
    },
    // [IS_NOT_NULL] — invoices that have been written off
    {
      ...FACTORIES[WidgetType.Stat](3, 5),
      title: 'IS NOT NULL — Has Write-Off',
      config: {
        value: '–', subValue: 'write_off_amount IS NOT NULL', trend: '', trendUp: false,
        accent: '#ef4444', prefix: '', suffix: '',
        description: 'IS_NOT_NULL: selects invoices where write_off_amount has a value — only 3 rows; sum of IS_NULL + IS_NOT_NULL = 35',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'invoice', field: 'write_off_amount', operator: FilterOperator.IsNotNull }],
          periodLabel: 'IS NOT NULL filter',
        },
      },
    },
    // [CONTAINS] — partial invoice number match
    {
      ...FACTORIES[WidgetType.Stat](6, 5),
      title: 'CONTAINS — 2025 Invoice Numbers',
      config: {
        value: '–', subValue: 'invoice_number CONTAINS "2025"', trend: '', trendUp: true,
        accent: '#8b5cf6', prefix: '', suffix: '',
        description: 'CONTAINS: case-insensitive partial match — selects all invoices where invoice_number contains "2025"',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'invoice', field: 'invoice_number', operator: FilterOperator.Contains, value: '2025' }],
          periodLabel: 'CONTAINS filter',
        },
      },
    },
    // [Combined EQ + IS_NOT_NULL] — compound filter: overdue invoices with write-offs
    {
      ...FACTORIES[WidgetType.Stat](9, 5),
      title: 'Combined — Overdue with Write-Off',
      config: {
        value: '–', subValue: 'status=overdue AND write_off_amount IS NOT NULL', trend: '', trendUp: false,
        accent: '#ec4899', prefix: '', suffix: '',
        description: 'Multiple filters combined: EQ on status AND IS_NOT_NULL on write_off_amount — both conditions must be true',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'id', function: AggregationFunction.Count },
          filterGroups: [{ id: 'g1', logic: 'AND', conditions: [
            { entity: 'invoice', field: 'status',           operator: FilterOperator.Eq,        value: 'overdue' },
            { entity: 'invoice', field: 'write_off_amount', operator: FilterOperator.IsNotNull },
          ]}],
          periodLabel: 'AND group',
        },
      },
    },

    // ── Section: Filters in Charts & Tables ────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 8),
      title: 'Section',
      config: { label: 'Filters Applied to Charts & Tables', accent: '#ec4899', showLine: true, align: TextAlign.Left },
    },

    // ── Row 9 — EQ filter bar + IN filter pie ──────────────────
    // [EQ in chart] — monthly count of paid invoices only
    {
      ...FACTORIES[WidgetType.Bar](0, 9),
      w: 7, h: 3,
      title: 'EQ Filter — Paid Invoices by Month',
      config: {
        accent: '#10b981', stacked: false, horizontal: false,
        showGrid: true, showLegend: false, series: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          dateAxis: { entity: 'invoice', field: 'invoice_date', interval: DateInterval.Month },
          valueAgg: { entity: 'invoice', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'invoice', field: 'status', operator: FilterOperator.Eq, value: 'paid' }],
          dateRangeField: { entity: 'invoice', field: 'invoice_date' },
        },
      },
    },
    // [GT in pie] — revenue breakdown for high-value invoices
    {
      ...FACTORIES[WidgetType.Pie](7, 9),
      w: 5, h: 3,
      title: 'GT Filter — Revenue by Type (amount > £200)',
      config: {
        innerRadius: 50, showLabels: false, showLegend: true, data: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          groupBy: { entity: 'invoice', field: 'invoice_type' },
          valueAgg: { entity: 'invoice', field: 'total_amount', function: AggregationFunction.Sum },
          filters: [{ entity: 'invoice', field: 'total_amount', operator: FilterOperator.Gt, value: 200 }],
          dateRangeField: { entity: 'invoice', field: 'invoice_date' },
        },
      },
    },

    // ── Row 12 — IS_NOT_NULL line + IN filter bar ──────────────
    // [IS_NOT_NULL in chart] — monthly trend of write-off invoices
    {
      ...FACTORIES[WidgetType.Line](0, 12),
      w: 6, h: 3,
      title: 'IS NOT NULL — Write-Off Invoices by Month',
      config: {
        areaFill: false, smooth: true, showGrid: true, showDots: true, showLegend: false,
        series: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          dateAxis: { entity: 'invoice', field: 'invoice_date', interval: DateInterval.Month },
          valueAgg: { entity: 'invoice', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'invoice', field: 'write_off_amount', operator: FilterOperator.IsNotNull }],
          dateRangeField: { entity: 'invoice', field: 'invoice_date' },
        },
      },
    },
    // [IN filter in bar] — consultation + procedure invoices by site
    {
      ...FACTORIES[WidgetType.Bar](6, 12),
      w: 6, h: 3,
      title: 'IN Filter — Consultation & Procedure by Site',
      config: {
        accent: '#22c55e', stacked: false, horizontal: true,
        showGrid: true, showLegend: false, series: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          groupBy: { entity: 'invoice', field: 'site_id' },
          valueAgg: { entity: 'invoice', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'invoice', field: 'invoice_type', operator: FilterOperator.In, values: ['consultation', 'procedure'] }],
        },
      },
    },

    // ── Row 15 — combined filter table ─────────────────────────
    // [IN + GTE combined table] — paid or partial invoices with significant amounts
    {
      ...FACTORIES[WidgetType.Table](0, 15),
      w: 12, h: 3,
      title: 'IN + GTE Filters — Active High-Value Invoices',
      config: {
        striped: true, compact: false, statusColumn: true,
        columns: [], rows: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          columns: [
            { entity: 'invoice', field: 'invoice_number'   },
            { entity: 'invoice', field: 'invoice_date'     },
            { entity: 'invoice', field: 'status'           },
            { entity: 'invoice', field: 'invoice_type'     },
            { entity: 'invoice', field: 'total_amount'     },
            { entity: 'invoice', field: 'paid_amount'      },
            { entity: 'invoice', field: 'write_off_amount' },
            { entity: 'invoice', field: 'site_id'          },
          ],
          filterGroups: [{ id: 'g1', logic: 'AND', conditions: [
            { entity: 'invoice', field: 'status',       operator: FilterOperator.In,  values: ['paid', 'partial', 'pending'] },
            { entity: 'invoice', field: 'total_amount', operator: FilterOperator.Gte, value: 200 },
          ]}],
          sort: { entity: 'invoice', field: 'invoice_date', direction: SortDirection.Desc },
          pageSize: 20,
          dateRangeField: { entity: 'invoice', field: 'invoice_date' },
        },
      },
    },

    // ── Row 18 — NOT_IN + IS_NOT_NULL combined table ────────────
    // [NOT_IN + IS_NOT_NULL table] — written-off invoices, excluding void
    {
      ...FACTORIES[WidgetType.Table](0, 18),
      w: 12, h: 3,
      title: 'NOT IN + IS NOT NULL — Written-Off (Excl. Void)',
      config: {
        striped: true, compact: true, statusColumn: false,
        columns: [], rows: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          columns: [
            { entity: 'invoice', field: 'invoice_number'   },
            { entity: 'invoice', field: 'invoice_date'     },
            { entity: 'invoice', field: 'status'           },
            { entity: 'invoice', field: 'invoice_type'     },
            { entity: 'invoice', field: 'total_amount'     },
            { entity: 'invoice', field: 'write_off_amount' },
            { entity: 'invoice', field: 'notes'            },
          ],
          filterGroups: [{ id: 'g1', logic: 'AND', conditions: [
            { entity: 'invoice', field: 'status',           operator: FilterOperator.NotIn,    values: ['void', 'cancelled'] },
            { entity: 'invoice', field: 'write_off_amount', operator: FilterOperator.IsNotNull },
          ]}],
          sort: { entity: 'invoice', field: 'write_off_amount', direction: SortDirection.Desc },
          pageSize: 20,
          dateRangeField: { entity: 'invoice', field: 'invoice_date' },
        },
      },
    },
  ];
}


// ───────────────────────────────────────────────────────────────
//  PRESCRIPTIONS AGGREGATION FUNCTIONS SHOWCASE
//  COUNT, COUNT_DISTINCT, SUM, AVG, MIN, MAX on
//  prescription/prescription_item/medication/dispense entities.
// ───────────────────────────────────────────────────────────────

function buildPrescriptionsAggregations(): Widget[] {
  return [
    // ── Section header ─────────────────────────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 0),
      title: 'Section',
      config: { label: 'Prescriptions — Aggregation Functions Showcase', accent: '#6366f1', showLine: true, align: TextAlign.Left },
    },

    // ── Row 1 — COUNT · COUNT_DISTINCT · SUM · AVG ─────────────
    // [COUNT] — total prescriptions issued
    {
      ...FACTORIES[WidgetType.Stat](0, 1),
      title: 'COUNT — Total Prescriptions',
      config: {
        value: '–', subValue: 'COUNT(prescription.id)', trend: '', trendUp: true,
        accent: '#6366f1', prefix: '', suffix: '',
        description: 'COUNT: counts every prescription row — expected 35',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          agg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          periodLabel: 'All records',
        },
      },
    },
    // [COUNT_DISTINCT] — unique patients prescribed to
    {
      ...FACTORIES[WidgetType.Stat](3, 1),
      title: 'COUNT DISTINCT — Unique Patients',
      config: {
        value: '–', subValue: 'COUNT_DISTINCT(patient_id)', trend: '', trendUp: true,
        accent: '#8b5cf6', prefix: '', suffix: '',
        description: 'COUNT_DISTINCT: deduplicates patient_id — 35 prescriptions but only 15 unique patients',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          agg: { entity: 'prescription', field: 'patient_id', function: AggregationFunction.CountDistinct },
          periodLabel: 'All records',
        },
      },
    },
    // [SUM] — total repeat count across all prescriptions
    {
      ...FACTORIES[WidgetType.Stat](6, 1),
      title: 'SUM — Total Repeat Authorisations',
      config: {
        value: '–', subValue: 'SUM(repeat_count)', trend: '', trendUp: true,
        accent: '#a78bfa', prefix: '', suffix: '',
        description: 'SUM on repeat_count — includes 0 for non-repeat rows; use filter is_repeat=true for a meaningful sum',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          agg: { entity: 'prescription', field: 'repeat_count', function: AggregationFunction.Sum },
          periodLabel: 'All records',
        },
      },
    },
    // [AVG] — mean repeat count (all rows — diluted by non-repeat zeros)
    {
      ...FACTORIES[WidgetType.Stat](9, 1),
      title: 'AVG — Repeat Count (all rows)',
      config: {
        value: '–', subValue: 'AVG(repeat_count)', trend: '', trendUp: false,
        accent: '#f59e0b', prefix: '', suffix: '',
        description: 'AVG on repeat_count — includes non-repeat rows with count=0, which dilutes the average. See Row 2 for filtered version.',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          agg: { entity: 'prescription', field: 'repeat_count', function: AggregationFunction.Avg },
          periodLabel: 'All records (diluted)',
        },
      },
    },

    // ── Row 2 — MIN · MAX · AVG (filtered repeat only) · SUM qty
    // [MIN] — shortest treatment course
    {
      ...FACTORIES[WidgetType.Stat](0, 2),
      title: 'MIN — Shortest Duration (days)',
      config: {
        value: '–', subValue: 'MIN(duration_days)', trend: '', trendUp: false,
        accent: '#06b6d4', prefix: '', suffix: ' days',
        description: 'MIN on prescription_item.duration_days — shortest treatment course in the dataset',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription', 'prescription_item'],
          agg: { entity: 'prescription_item', field: 'duration_days', function: AggregationFunction.Min },
          periodLabel: 'All records',
        },
      },
    },
    // [MAX] — longest treatment course
    {
      ...FACTORIES[WidgetType.Stat](3, 2),
      title: 'MAX — Longest Duration (days)',
      config: {
        value: '–', subValue: 'MAX(duration_days)', trend: '', trendUp: true,
        accent: '#ef4444', prefix: '', suffix: ' days',
        description: 'MAX on prescription_item.duration_days — longest authorised treatment course',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription', 'prescription_item'],
          agg: { entity: 'prescription_item', field: 'duration_days', function: AggregationFunction.Max },
          periodLabel: 'All records',
        },
      },
    },
    // [AVG on filtered set — repeat only] — avg repeat count with dilution filter applied
    {
      ...FACTORIES[WidgetType.Stat](6, 2),
      title: 'AVG — Repeat Count (repeat only)',
      config: {
        value: '–', subValue: 'AVG(repeat_count) where is_repeat=true', trend: '', trendUp: true,
        accent: '#f97316', prefix: '', suffix: '',
        description: 'AVG with filter is_repeat=true: excludes zero-count rows — compare with Row 1 unfiltered AVG to see dilution effect',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          agg: { entity: 'prescription', field: 'repeat_count', function: AggregationFunction.Avg },
          filters: [{ entity: 'prescription', field: 'is_repeat', operator: FilterOperator.Eq, value: 'true' }],
          periodLabel: 'Repeat Rx only',
        },
      },
    },
    // [SUM on dispense quantity] — total units dispensed
    {
      ...FACTORIES[WidgetType.Stat](9, 2),
      title: 'SUM — Total Units Dispensed',
      config: {
        value: '–', subValue: 'SUM(dispensed_quantity)', trend: '', trendUp: true,
        accent: '#22c55e', prefix: '', suffix: '',
        description: 'SUM on dispense.dispensed_quantity — total units actually dispensed across all dispense records',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription', 'dispense'],
          agg: { entity: 'dispense', field: 'dispensed_quantity', function: AggregationFunction.Sum },
          periodLabel: 'All dispenses',
        },
      },
    },

    // ── Row 4 — COUNT by month bar + COUNT by drug class pie ───
    // [COUNT in chart] — prescriptions issued per month
    {
      ...FACTORIES[WidgetType.Bar](0, 4),
      w: 7, h: 3,
      title: 'COUNT — Prescriptions by Month',
      config: {
        accent: '#6366f1', stacked: false, horizontal: false,
        showGrid: true, showLegend: false, series: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          dateAxis: { entity: 'prescription', field: 'prescribed_date', interval: DateInterval.Month },
          valueAgg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          dateRangeField: { entity: 'prescription', field: 'prescribed_date' },
        },
      },
    },
    // [COUNT grouped by drug class] — prescriptions split by therapeutic class
    {
      ...FACTORIES[WidgetType.Pie](7, 4),
      w: 5, h: 3,
      title: 'COUNT — Prescriptions by Drug Class',
      config: {
        innerRadius: 50, showLabels: false, showLegend: true, data: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription', 'prescription_item', 'medication'],
          groupBy: { entity: 'medication', field: 'drug_class' },
          valueAgg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          dateRangeField: { entity: 'prescription', field: 'prescribed_date' },
        },
      },
    },

    // ── Row 7 — analytics trend + full detail table ─────────
    // [AVG in analytics] — average repeat count trend over months
    {
      ...FACTORIES[WidgetType.Analytics](0, 7),
      w: 4, h: 3,
      title: 'AVG Repeat Count — Monthly Trend',
      config: {
        value: '–', changeValue: '', changeLabel: 'vs previous period',
        trendUp: true, accent: '#a78bfa', data: [], period: '',
        selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          agg: { entity: 'prescription', field: 'repeat_count', function: AggregationFunction.Avg },
          periodLabel: 'Monthly avg',
          trend: { entity: 'prescription', field: 'prescribed_date', interval: DateInterval.Month, periods: 12 },
        },
      },
    },
    // [Table] — prescriptions with repeat_count and duration visible
    {
      ...FACTORIES[WidgetType.Table](4, 7),
      w: 8, h: 3,
      title: 'Prescriptions — Repeat Count & Duration',
      config: {
        striped: true, compact: false, statusColumn: true,
        columns: [], rows: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription', 'prescription_item', 'medication'],
          columns: [
            { entity: 'prescription',      field: 'prescription_number' },
            { entity: 'prescription',      field: 'prescribed_date'     },
            { entity: 'prescription',      field: 'status'              },
            { entity: 'prescription',      field: 'priority'            },
            { entity: 'prescription',      field: 'is_repeat'           },
            { entity: 'prescription',      field: 'repeat_count'        },
            { entity: 'prescription_item', field: 'quantity'            },
            { entity: 'prescription_item', field: 'duration_days'       },
            { entity: 'medication',        field: 'name'                },
            { entity: 'medication',        field: 'drug_class'          },
          ],
          sort: { entity: 'prescription', field: 'prescribed_date', direction: SortDirection.Desc },
          pageSize: 20,
          dateRangeField: { entity: 'prescription', field: 'prescribed_date' },
        },
      },
    },

    // ── Section: Grouped Aggregations ──────────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 10),
      title: 'Section',
      config: { label: 'Grouped Aggregations', accent: '#6366f1', showLine: true, align: TextAlign.Left },
    },

    // ── Row 11 — COUNT_DISTINCT patients per prescriber + AVG duration by drug class
    // [COUNT_DISTINCT grouped] — distinct patients per prescriber
    {
      ...FACTORIES[WidgetType.Bar](0, 11),
      w: 6, h: 3,
      title: 'COUNT DISTINCT — Patients per Prescriber',
      config: {
        accent: '#8b5cf6', stacked: false, horizontal: true,
        showGrid: true, showLegend: false, series: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription', 'prescription_item', 'medication', 'prescriber'],
          groupBy: { entity: 'prescriber', field: 'lastname' },
          valueAgg: { entity: 'prescription', field: 'patient_id', function: AggregationFunction.CountDistinct },
        },
      },
    },
    // [AVG grouped] — average duration by drug class
    {
      ...FACTORIES[WidgetType.Bar](6, 11),
      w: 6, h: 3,
      title: 'AVG — Duration by Drug Class (days)',
      config: {
        accent: '#f59e0b', stacked: false, horizontal: true,
        showGrid: true, showLegend: false, series: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription', 'prescription_item', 'medication'],
          groupBy: { entity: 'medication', field: 'drug_class' },
          valueAgg: { entity: 'prescription_item', field: 'duration_days', function: AggregationFunction.Avg },
        },
      },
    },

    // ── Row 14 — SUM dispense trend line + MAX repeat by status pie
    // [SUM over time] — monthly dispense quantity as a line
    {
      ...FACTORIES[WidgetType.Line](0, 14),
      w: 7, h: 3,
      title: 'SUM — Dispensed Quantity Trend by Month',
      config: {
        areaFill: true, smooth: true, showGrid: true, showDots: false, showLegend: false,
        series: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription', 'dispense'],
          dateAxis: { entity: 'dispense', field: 'dispensed_date', interval: DateInterval.Month },
          valueAgg: { entity: 'dispense', field: 'dispensed_quantity', function: AggregationFunction.Sum },
          dateRangeField: { entity: 'prescription', field: 'prescribed_date' },
        },
      },
    },
    // [COUNT grouped by status] — prescription counts per status
    {
      ...FACTORIES[WidgetType.Pie](7, 14),
      w: 5, h: 3,
      title: 'COUNT — Prescriptions by Status',
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

    // ── Row 17 — MAX repeat + MIN/MAX qty + SUM repeat (filtered)
    // [MAX repeat count]
    {
      ...FACTORIES[WidgetType.Stat](0, 17),
      title: 'MAX — Highest Repeat Count',
      config: {
        value: '–', subValue: 'MAX(repeat_count)', trend: '', trendUp: true,
        accent: '#ef4444', prefix: '', suffix: ' repeats',
        description: 'MAX on repeat_count — expected 12 (rx-009/021/035)',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          agg: { entity: 'prescription', field: 'repeat_count', function: AggregationFunction.Max },
          periodLabel: 'All records',
        },
      },
    },
    // [MIN quantity] — smallest prescription
    {
      ...FACTORIES[WidgetType.Stat](3, 17),
      title: 'MIN — Smallest Quantity Prescribed',
      config: {
        value: '–', subValue: 'MIN(quantity)', trend: '', trendUp: false,
        accent: '#06b6d4', prefix: '', suffix: ' units',
        description: 'MIN on prescription_item.quantity — smallest single-item prescription (1 inhaler)',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription', 'prescription_item'],
          agg: { entity: 'prescription_item', field: 'quantity', function: AggregationFunction.Min },
          periodLabel: 'All records',
        },
      },
    },
    // [MAX quantity] — largest prescription
    {
      ...FACTORIES[WidgetType.Stat](6, 17),
      title: 'MAX — Largest Quantity Prescribed',
      config: {
        value: '–', subValue: 'MAX(quantity)', trend: '', trendUp: true,
        accent: '#22c55e', prefix: '', suffix: ' units',
        description: 'MAX on prescription_item.quantity — largest item (100ml liquid)',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription', 'prescription_item'],
          agg: { entity: 'prescription_item', field: 'quantity', function: AggregationFunction.Max },
          periodLabel: 'All records',
        },
      },
    },
    // [COUNT_DISTINCT medications] — unique drugs used
    {
      ...FACTORIES[WidgetType.Stat](9, 17),
      title: 'COUNT DISTINCT — Unique Medications',
      config: {
        value: '–', subValue: 'COUNT_DISTINCT(medication_id)', trend: '', trendUp: true,
        accent: '#10b981', prefix: '', suffix: '',
        description: 'COUNT_DISTINCT on medication_id — unique medications prescribed, regardless of how many times each was used',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription', 'prescription_item'],
          agg: { entity: 'prescription_item', field: 'medication_id', function: AggregationFunction.CountDistinct },
          periodLabel: 'All records',
        },
      },
    },

    // ── Row 19 — AVG quantity grouped by unit type bar ─────────
    // [AVG grouped] — avg quantity per unit type
    {
      ...FACTORIES[WidgetType.Bar](0, 19),
      w: 12, h: 3,
      title: 'AVG — Quantity by Unit Type',
      config: {
        accent: '#a78bfa', stacked: false, horizontal: false,
        showGrid: true, showLegend: false, series: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription', 'prescription_item'],
          groupBy: { entity: 'prescription_item', field: 'unit' },
          valueAgg: { entity: 'prescription_item', field: 'quantity', function: AggregationFunction.Avg },
        },
      },
    },
  ];
}


// ───────────────────────────────────────────────────────────────
//  PRESCRIPTIONS FILTER OPERATIONS SHOWCASE
//  eq, neq, gt, gte, lt, lte, is_null, is_not_null,
//  in, not_in, contains — one widget per operator, using
//  prescription/prescription_item/medication/dispense entities.
// ───────────────────────────────────────────────────────────────

function buildPrescriptionsFilterOps(): Widget[] {
  return [
    // ── Section header ─────────────────────────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 0),
      title: 'Section',
      config: { label: 'Prescriptions — Filter Operations Showcase', accent: '#ec4899', showLine: true, align: TextAlign.Left },
    },

    // ── Row 1 — EQ · NEQ · GT · GTE ───────────────────────────
    // [EQ] — exact status match
    {
      ...FACTORIES[WidgetType.Stat](0, 1),
      title: 'EQ — Dispensed Prescriptions',
      config: {
        value: '–', subValue: 'status = "dispensed"', trend: '', trendUp: true,
        accent: '#10b981', prefix: '', suffix: '',
        description: 'EQ (=): filters prescriptions where status exactly equals "dispensed"',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          agg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'prescription', field: 'status', operator: FilterOperator.Eq, value: 'dispensed' }],
          periodLabel: 'EQ filter',
        },
      },
    },
    // [NEQ] — not cancelled
    {
      ...FACTORIES[WidgetType.Stat](3, 1),
      title: 'NEQ — Excluding Cancelled',
      config: {
        value: '–', subValue: 'status != "cancelled"', trend: '', trendUp: true,
        accent: '#3b82f6', prefix: '', suffix: '',
        description: 'NEQ (!=): excludes cancelled prescriptions — all other statuses included',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          agg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'prescription', field: 'status', operator: FilterOperator.Neq, value: 'cancelled' }],
          periodLabel: 'NEQ filter',
        },
      },
    },
    // [GT] — prescriptions with many repeats
    {
      ...FACTORIES[WidgetType.Stat](6, 1),
      title: 'GT — Repeat Count > 5',
      config: {
        value: '–', subValue: 'repeat_count > 5', trend: '', trendUp: true,
        accent: '#f59e0b', prefix: '', suffix: '',
        description: 'GT (>): only prescriptions where repeat_count is strictly greater than 5 — long-term repeat patients',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          agg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'prescription', field: 'repeat_count', operator: FilterOperator.Gt, value: 5 }],
          periodLabel: 'GT filter',
        },
      },
    },
    // [GTE] — prescriptions with high duration
    {
      ...FACTORIES[WidgetType.Stat](9, 1),
      title: 'GTE — Duration >= 28 days',
      config: {
        value: '–', subValue: 'duration_days >= 28', trend: '', trendUp: true,
        accent: '#a78bfa', prefix: '', suffix: '',
        description: 'GTE (>=): items where duration_days is 28 or more — monthly and longer courses',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription', 'prescription_item'],
          agg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'prescription_item', field: 'duration_days', operator: FilterOperator.Gte, value: 28 }],
          periodLabel: 'GTE filter',
        },
      },
    },

    // ── Row 3 — LT · LTE · IN · NOT_IN ────────────────────────
    // [LT] — short courses only
    {
      ...FACTORIES[WidgetType.Stat](0, 3),
      title: 'LT — Duration < 14 days',
      config: {
        value: '–', subValue: 'duration_days < 14', trend: '', trendUp: false,
        accent: '#ef4444', prefix: '', suffix: '',
        description: 'LT (<): items where duration_days is less than 14 — acute short-course treatments',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription', 'prescription_item'],
          agg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'prescription_item', field: 'duration_days', operator: FilterOperator.Lt, value: 14 }],
          periodLabel: 'LT filter',
        },
      },
    },
    // [LTE] — week or shorter
    {
      ...FACTORIES[WidgetType.Stat](3, 3),
      title: 'LTE — Duration <= 7 days',
      config: {
        value: '–', subValue: 'duration_days <= 7', trend: '', trendUp: false,
        accent: '#f97316', prefix: '', suffix: '',
        description: 'LTE (<=): includes exactly 7-day courses — captures antibiotics and acute treatments; compare with LT < 14',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription', 'prescription_item'],
          agg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'prescription_item', field: 'duration_days', operator: FilterOperator.Lte, value: 7 }],
          periodLabel: 'LTE filter',
        },
      },
    },
    // [IN] — multiple priority values
    {
      ...FACTORIES[WidgetType.Stat](6, 3),
      title: 'IN — Urgent or Emergency',
      config: {
        value: '–', subValue: 'priority IN [urgent, emergency]', trend: '', trendUp: false,
        accent: '#ec4899', prefix: '', suffix: '',
        description: 'IN: matches any prescription where priority is urgent or emergency — non-routine workload',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          agg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'prescription', field: 'priority', operator: FilterOperator.In, values: ['urgent', 'emergency'] }],
          periodLabel: 'IN filter',
        },
      },
    },
    // [NOT_IN] — exclude non-routine
    {
      ...FACTORIES[WidgetType.Stat](9, 3),
      title: 'NOT IN — Routine Only',
      config: {
        value: '–', subValue: 'priority NOT IN [urgent, emergency]', trend: '', trendUp: true,
        accent: '#06b6d4', prefix: '', suffix: '',
        description: 'NOT_IN: excludes urgent and emergency prescriptions — only routine workload',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          agg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'prescription', field: 'priority', operator: FilterOperator.NotIn, values: ['urgent', 'emergency'] }],
          periodLabel: 'NOT_IN filter',
        },
      },
    },

    // ── Row 5 — IS_NULL · IS_NOT_NULL · CONTAINS · combined ────
    // [IS_NULL] — prescriptions without notes
    {
      ...FACTORIES[WidgetType.Stat](0, 5),
      title: 'IS NULL — No Notes',
      config: {
        value: '–', subValue: 'notes IS NULL', trend: '', trendUp: true,
        accent: '#6b7280', prefix: '', suffix: '',
        description: 'IS_NULL: selects prescriptions where notes is null — most routine prescriptions have no free-text notes',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          agg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'prescription', field: 'notes', operator: FilterOperator.IsNull }],
          periodLabel: 'IS NULL filter',
        },
      },
    },
    // [IS_NOT_NULL] — prescriptions with clinical notes
    {
      ...FACTORIES[WidgetType.Stat](3, 5),
      title: 'IS NOT NULL — Has Notes',
      config: {
        value: '–', subValue: 'notes IS NOT NULL', trend: '', trendUp: false,
        accent: '#10b981', prefix: '', suffix: '',
        description: 'IS_NOT_NULL: selects prescriptions where notes has a value — these are the annotated/exception rows. Sum of IS_NULL + IS_NOT_NULL = 35',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          agg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'prescription', field: 'notes', operator: FilterOperator.IsNotNull }],
          periodLabel: 'IS NOT NULL filter',
        },
      },
    },
    // [CONTAINS] — partial Rx number match
    {
      ...FACTORIES[WidgetType.Stat](6, 5),
      title: 'CONTAINS — 2025 Prescriptions',
      config: {
        value: '–', subValue: 'prescription_number CONTAINS "2025"', trend: '', trendUp: true,
        accent: '#8b5cf6', prefix: '', suffix: '',
        description: 'CONTAINS: case-insensitive partial match — selects all prescriptions where prescription_number contains "2025"',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          agg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'prescription', field: 'prescription_number', operator: FilterOperator.Contains, value: '2025' }],
          periodLabel: 'CONTAINS filter',
        },
      },
    },
    // [Combined EQ + IS_NOT_NULL] — emergency prescriptions with notes
    {
      ...FACTORIES[WidgetType.Stat](9, 5),
      title: 'Combined — Emergency with Notes',
      config: {
        value: '–', subValue: 'priority=emergency AND notes IS NOT NULL', trend: '', trendUp: false,
        accent: '#ef4444', prefix: '', suffix: '',
        description: 'Multiple filters combined: EQ on priority AND IS_NOT_NULL on notes — all 3 emergency prescriptions have notes attached',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          agg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filters: [
            { entity: 'prescription', field: 'priority', operator: FilterOperator.Eq,        value: 'emergency' },
            { entity: 'prescription', field: 'notes',    operator: FilterOperator.IsNotNull },
          ],
          periodLabel: 'Combined filter',
        },
      },
    },

    // ── Section: Filters in Charts & Tables ────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 8),
      title: 'Section',
      config: { label: 'Filters Applied to Charts & Tables', accent: '#ec4899', showLine: true, align: TextAlign.Left },
    },

    // ── Row 9 — EQ filter bar + IN filter pie ──────────────────
    // [EQ in chart] — dispensed prescriptions by month
    {
      ...FACTORIES[WidgetType.Bar](0, 9),
      w: 7, h: 3,
      title: 'EQ Filter — Dispensed Prescriptions by Month',
      config: {
        accent: '#10b981', stacked: false, horizontal: false,
        showGrid: true, showLegend: false, series: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          dateAxis: { entity: 'prescription', field: 'prescribed_date', interval: DateInterval.Month },
          valueAgg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'prescription', field: 'status', operator: FilterOperator.Eq, value: 'dispensed' }],
          dateRangeField: { entity: 'prescription', field: 'prescribed_date' },
        },
      },
    },
    // [IN in pie] — urgent + emergency by priority
    {
      ...FACTORIES[WidgetType.Pie](7, 9),
      w: 5, h: 3,
      title: 'IN Filter — Urgent & Emergency by Status',
      config: {
        innerRadius: 50, showLabels: false, showLegend: true, data: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          groupBy: { entity: 'prescription', field: 'status' },
          valueAgg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'prescription', field: 'priority', operator: FilterOperator.In, values: ['urgent', 'emergency'] }],
          dateRangeField: { entity: 'prescription', field: 'prescribed_date' },
        },
      },
    },

    // ── Row 12 — IS_NOT_NULL line + GT filter bar ──────────────
    // [IS_NOT_NULL in chart] — trend of annotated prescriptions
    {
      ...FACTORIES[WidgetType.Line](0, 12),
      w: 6, h: 3,
      title: 'IS NOT NULL — Annotated Prescriptions by Month',
      config: {
        areaFill: false, smooth: true, showGrid: true, showDots: true, showLegend: false,
        series: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          dateAxis: { entity: 'prescription', field: 'prescribed_date', interval: DateInterval.Month },
          valueAgg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'prescription', field: 'notes', operator: FilterOperator.IsNotNull }],
          dateRangeField: { entity: 'prescription', field: 'prescribed_date' },
        },
      },
    },
    // [GT in bar] — high-repeat prescriptions by site
    {
      ...FACTORIES[WidgetType.Bar](6, 12),
      w: 6, h: 3,
      title: 'GT Filter — High-Repeat Rx by Site (> 5)',
      config: {
        accent: '#a78bfa', stacked: false, horizontal: true,
        showGrid: true, showLegend: false, series: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          groupBy: { entity: 'prescription', field: 'site_id' },
          valueAgg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filters: [{ entity: 'prescription', field: 'repeat_count', operator: FilterOperator.Gt, value: 5 }],
        },
      },
    },

    // ── Row 15 — combined filter table ─────────────────────────
    // [IN + GTE combined table] — active/dispensed long-course repeat prescriptions
    {
      ...FACTORIES[WidgetType.Table](0, 15),
      w: 12, h: 3,
      title: 'IN + GTE Filters — Active Long-Course Repeat Prescriptions',
      config: {
        striped: true, compact: false, statusColumn: true,
        columns: [], rows: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription', 'prescription_item', 'medication'],
          columns: [
            { entity: 'prescription',      field: 'prescription_number' },
            { entity: 'prescription',      field: 'prescribed_date'     },
            { entity: 'prescription',      field: 'status'              },
            { entity: 'prescription',      field: 'priority'            },
            { entity: 'prescription',      field: 'is_repeat'           },
            { entity: 'prescription',      field: 'repeat_count'        },
            { entity: 'prescription_item', field: 'duration_days'       },
            { entity: 'medication',        field: 'name'                },
            { entity: 'medication',        field: 'drug_class'          },
          ],
          filterGroups: [{ id: 'g1', logic: 'AND', conditions: [
            { entity: 'prescription',      field: 'status',        operator: FilterOperator.In,  values: ['active', 'dispensed', 'partial'] },
            { entity: 'prescription_item', field: 'duration_days', operator: FilterOperator.Gte, value: 28 },
          ]}],
          sort: { entity: 'prescription', field: 'prescribed_date', direction: SortDirection.Desc },
          pageSize: 20,
          dateRangeField: { entity: 'prescription', field: 'prescribed_date' },
        },
      },
    },

    // ── Row 18 — NOT_IN + IS_NOT_NULL combined table ────────────
    // [NOT_IN + IS_NOT_NULL table] — annotated non-routine prescriptions
    {
      ...FACTORIES[WidgetType.Table](0, 18),
      w: 12, h: 3,
      title: 'NOT IN + IS NOT NULL — Urgent/Emergency with Notes',
      config: {
        striped: true, compact: true, statusColumn: false,
        columns: [], rows: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription', 'prescription_item', 'medication'],
          columns: [
            { entity: 'prescription',      field: 'prescription_number' },
            { entity: 'prescription',      field: 'prescribed_date'     },
            { entity: 'prescription',      field: 'status'              },
            { entity: 'prescription',      field: 'priority'            },
            { entity: 'prescription',      field: 'repeat_count'        },
            { entity: 'prescription',      field: 'notes'               },
            { entity: 'medication',        field: 'name'                },
            { entity: 'medication',        field: 'is_controlled'       },
          ],
          filterGroups: [{ id: 'g1', logic: 'AND', conditions: [
            { entity: 'prescription', field: 'status', operator: FilterOperator.NotIn,    values: ['cancelled', 'expired'] },
            { entity: 'prescription', field: 'notes',  operator: FilterOperator.IsNotNull },
          ]}],
          sort: { entity: 'prescription', field: 'prescribed_date', direction: SortDirection.Desc },
          pageSize: 20,
          dateRangeField: { entity: 'prescription', field: 'prescribed_date' },
        },
      },
    },
  ];
}


// ───────────────────────────────────────────────────────────────
//  EPX — AND/OR FILTER GROUPS SHOWCASE
//  Demonstrates: explicit AND groups, OR groups, two-group
//  combinations (OR_group AND AND_group), charts & tables
// ───────────────────────────────────────────────────────────────

function buildEpxFilterGroups(): Widget[] {
  // Shorthand helper so inline filterGroups are concise
  const andGroup  = (id: string, conditions: FilterGroup['conditions']): FilterGroup => ({ id, logic: 'AND', conditions });
  const orGroup   = (id: string, conditions: FilterGroup['conditions']): FilterGroup => ({ id, logic: 'OR',  conditions });

  return [
    // ── Section header ─────────────────────────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 0),
      title: 'Section',
      config: { label: 'EPX — AND / OR Filter Groups', accent: '#3b82f6', showLine: true, align: TextAlign.Left },
    },

    // ── Section A: Single AND Group ────────────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 1),
      title: 'Section',
      config: { label: 'Section A — Single AND Group (all conditions must match)', accent: '#3b82f6', showLine: false, align: TextAlign.Left },
    },

    // [AND] completed AND rated
    {
      ...FACTORIES[WidgetType.Stat](0, 2),
      title: 'Completed AND Rated',
      config: {
        value: '–', subValue: 'status=completed AND rating IS NOT NULL', trend: '', trendUp: true,
        accent: '#10b981', prefix: '', suffix: '',
        description: 'AND group: appointment must be completed AND the patient must have left a rating',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filterGroups: [andGroup('g1', [
            { entity: 'appointment',         field: 'status', operator: FilterOperator.Eq,        value: 'completed' },
            { entity: 'appointment_patient', field: 'rating', operator: FilterOperator.IsNotNull },
          ])],
          periodLabel: 'AND group',
        },
      },
    },
    // [AND] remote AND invoiced
    {
      ...FACTORIES[WidgetType.Stat](3, 2),
      title: 'Remote AND Invoiced',
      config: {
        value: '–', subValue: 'is_remote=true AND invoiced=true', trend: '', trendUp: true,
        accent: '#8b5cf6', prefix: '', suffix: '',
        description: 'AND group: remote video appointment that has also been invoiced — both boolean fields true',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filterGroups: [andGroup('g1', [
            { entity: 'appointment', field: 'is_remote',  operator: FilterOperator.Eq, value: 'true' },
            { entity: 'appointment', field: 'invoiced',   operator: FilterOperator.Eq, value: 'true' },
          ])],
          periodLabel: 'AND group',
        },
      },
    },
    // [AND] confirmed AND high-value
    {
      ...FACTORIES[WidgetType.Stat](6, 2),
      title: 'Confirmed AND High-Value (≥ £120)',
      config: {
        value: '–', subValue: 'status=confirmed AND price≥120', trend: '', trendUp: true,
        accent: '#f59e0b', prefix: '', suffix: '',
        description: 'AND group: confirmed appointments where the consultation fee is £120 or above',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filterGroups: [andGroup('g1', [
            { entity: 'appointment',         field: 'status', operator: FilterOperator.Eq,  value: 'confirmed' },
            { entity: 'appointment_patient', field: 'price',  operator: FilterOperator.Gte, value: 120 },
          ])],
          periodLabel: 'AND group',
        },
      },
    },
    // [AND] no_show AND in-person (wasted slot)
    {
      ...FACTORIES[WidgetType.Stat](9, 2),
      title: 'No-Show AND In-Person',
      config: {
        value: '–', subValue: 'status=no_show AND is_remote=false', trend: '', trendUp: false,
        accent: '#ef4444', prefix: '', suffix: '',
        description: 'AND group: in-person slots that were wasted by a no-show — remote no-shows excluded',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filterGroups: [andGroup('g1', [
            { entity: 'appointment', field: 'status',    operator: FilterOperator.Eq, value: 'no_show' },
            { entity: 'appointment', field: 'is_remote', operator: FilterOperator.Eq, value: 'false'   },
          ])],
          periodLabel: 'AND group',
        },
      },
    },

    // ── Section B: Single OR Group ─────────────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 4),
      title: 'Section',
      config: { label: 'Section B — Single OR Group (any condition matches)', accent: '#f59e0b', showLine: false, align: TextAlign.Left },
    },

    // [OR] no_show OR cancelled (absences)
    {
      ...FACTORIES[WidgetType.Stat](0, 5),
      title: 'No-Show OR Cancelled',
      config: {
        value: '–', subValue: 'status=no_show OR status=cancelled', trend: '', trendUp: false,
        accent: '#ef4444', prefix: '', suffix: '',
        description: 'OR group: lost appointments — either patient did not attend OR appointment was cancelled',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filterGroups: [orGroup('g1', [
            { entity: 'appointment', field: 'status', operator: FilterOperator.Eq, value: 'no_show'   },
            { entity: 'appointment', field: 'status', operator: FilterOperator.Eq, value: 'cancelled' },
          ])],
          periodLabel: 'OR group',
        },
      },
    },
    // [OR] confirmed OR scheduled (upcoming pipeline)
    {
      ...FACTORIES[WidgetType.Stat](3, 5),
      title: 'Confirmed OR Scheduled',
      config: {
        value: '–', subValue: 'status=confirmed OR status=scheduled', trend: '', trendUp: true,
        accent: '#3b82f6', prefix: '', suffix: '',
        description: 'OR group: upcoming appointments pipeline — either confirmed or newly scheduled',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filterGroups: [orGroup('g1', [
            { entity: 'appointment', field: 'status', operator: FilterOperator.Eq, value: 'confirmed'  },
            { entity: 'appointment', field: 'status', operator: FilterOperator.Eq, value: 'scheduled'  },
          ])],
          periodLabel: 'OR group',
        },
      },
    },
    // [OR] remote OR high-value (premium workload)
    {
      ...FACTORIES[WidgetType.Stat](6, 5),
      title: 'Remote OR High-Value',
      config: {
        value: '–', subValue: 'is_remote=true OR price≥130', trend: '', trendUp: true,
        accent: '#a78bfa', prefix: '', suffix: '',
        description: 'OR group: premium workload — video consultations OR consultations priced ≥ £130 (overlapping sets possible)',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filterGroups: [orGroup('g1', [
            { entity: 'appointment',         field: 'is_remote', operator: FilterOperator.Eq,  value: 'true' },
            { entity: 'appointment_patient', field: 'price',     operator: FilterOperator.Gte, value: 130   },
          ])],
          periodLabel: 'OR group',
        },
      },
    },
    // [OR] rated OR invoiced (any revenue signal)
    {
      ...FACTORIES[WidgetType.Stat](9, 5),
      title: 'Rated OR Invoiced',
      config: {
        value: '–', subValue: 'rating IS NOT NULL OR invoiced=true', trend: '', trendUp: true,
        accent: '#06b6d4', prefix: '', suffix: '',
        description: 'OR group: any appointment with a revenue signal — patient feedback OR billing raised',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filterGroups: [orGroup('g1', [
            { entity: 'appointment_patient', field: 'rating',   operator: FilterOperator.IsNotNull },
            { entity: 'appointment',         field: 'invoiced', operator: FilterOperator.Eq, value: 'true' },
          ])],
          periodLabel: 'OR group',
        },
      },
    },

    // ── Section C: Two Groups — (Group1) AND (Group2) ──────────
    {
      ...FACTORIES[WidgetType.Section](0, 7),
      title: 'Section',
      config: { label: 'Section C — Two Filter Groups: (Group1) AND (Group2)', accent: '#ec4899', showLine: false, align: TextAlign.Left },
    },

    // [OR-group AND AND-group] (completed OR confirmed) AND price>=100
    {
      ...FACTORIES[WidgetType.Stat](0, 8),
      title: '(Completed OR Confirmed) AND Price ≥ £100',
      config: {
        value: '–', subValue: '(status=completed|confirmed) AND price≥100', trend: '', trendUp: true,
        accent: '#10b981', prefix: '', suffix: '',
        description: 'Two groups: OR-group picks attended/upcoming; AND-group enforces high-value threshold — rows must satisfy both groups',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filterGroups: [
            orGroup('g1',  [
              { entity: 'appointment', field: 'status', operator: FilterOperator.Eq, value: 'completed' },
              { entity: 'appointment', field: 'status', operator: FilterOperator.Eq, value: 'confirmed' },
            ]),
            andGroup('g2', [
              { entity: 'appointment_patient', field: 'price', operator: FilterOperator.Gte, value: 100 },
            ]),
          ],
          periodLabel: 'OR AND combined',
        },
      },
    },
    // [OR-group AND AND-group] (no_show OR cancelled) AND site=SITE-001
    {
      ...FACTORIES[WidgetType.Stat](4, 8),
      title: '(No-Show OR Cancelled) AND Site-001',
      config: {
        value: '–', subValue: '(no_show|cancelled) AND site_id=SITE-001', trend: '', trendUp: false,
        accent: '#ef4444', prefix: '', suffix: '',
        description: 'Two groups: OR-group captures lost appointments; AND-group scopes to Site-001 only — identifies problem bookings at one site',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filterGroups: [
            orGroup('g1',  [
              { entity: 'appointment', field: 'status', operator: FilterOperator.Eq, value: 'no_show'   },
              { entity: 'appointment', field: 'status', operator: FilterOperator.Eq, value: 'cancelled' },
            ]),
            andGroup('g2', [
              { entity: 'appointment', field: 'site_id', operator: FilterOperator.Eq, value: 'SITE-001' },
            ]),
          ],
          periodLabel: 'OR AND combined',
        },
      },
    },
    // [AND-group AND AND-group] (remote=true AND invoiced=true) AND (price>80)
    {
      ...FACTORIES[WidgetType.Stat](8, 8),
      title: 'Remote AND Invoiced AND Price > £80',
      config: {
        value: '–', subValue: '(remote=true AND invoiced=true) AND (price>80)', trend: '', trendUp: true,
        accent: '#8b5cf6', prefix: '', suffix: '',
        description: 'Two AND groups: Group1 requires remote and invoiced; Group2 enforces minimum price — triple-condition filter across two groups',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          agg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filterGroups: [
            andGroup('g1', [
              { entity: 'appointment', field: 'is_remote',  operator: FilterOperator.Eq,  value: 'true' },
              { entity: 'appointment', field: 'invoiced',   operator: FilterOperator.Eq,  value: 'true' },
            ]),
            andGroup('g2', [
              { entity: 'appointment_patient', field: 'price', operator: FilterOperator.Gt, value: 80 },
            ]),
          ],
          periodLabel: 'AND + AND groups',
        },
      },
    },

    // ── Section D: Charts with Filter Groups ───────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 10),
      title: 'Section',
      config: { label: 'Section D — Charts & Table with Filter Groups', accent: '#3b82f6', showLine: false, align: TextAlign.Left },
    },

    // [OR group in bar] (completed OR confirmed) by site
    {
      ...FACTORIES[WidgetType.Bar](0, 11),
      w: 6, h: 3,
      title: 'OR Group — (Completed OR Confirmed) by Site',
      config: {
        accent: '#10b981', stacked: false, horizontal: true,
        showGrid: true, showLegend: false, series: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          groupBy: { entity: 'appointment', field: 'site_id' },
          valueAgg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filterGroups: [orGroup('g1', [
            { entity: 'appointment', field: 'status', operator: FilterOperator.Eq, value: 'completed' },
            { entity: 'appointment', field: 'status', operator: FilterOperator.Eq, value: 'confirmed' },
          ])],
        },
      },
    },
    // [AND group in bar] (remote AND invoiced) monthly trend
    {
      ...FACTORIES[WidgetType.Bar](6, 11),
      w: 6, h: 3,
      title: 'AND Group — Remote AND Invoiced by Month',
      config: {
        accent: '#8b5cf6', stacked: false, horizontal: false,
        showGrid: true, showLegend: false, series: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          dateAxis: { entity: 'appointment', field: 'start_date', interval: DateInterval.Month },
          valueAgg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filterGroups: [andGroup('g1', [
            { entity: 'appointment', field: 'is_remote', operator: FilterOperator.Eq, value: 'true' },
            { entity: 'appointment', field: 'invoiced',  operator: FilterOperator.Eq, value: 'true' },
          ])],
          dateRangeField: { entity: 'appointment', field: 'start_date' },
        },
      },
    },
    // [OR group in pie] (no_show OR cancelled) revenue lost by payor
    {
      ...FACTORIES[WidgetType.Pie](0, 14),
      w: 5, h: 3,
      title: 'OR Group — Lost Appointments by Payor',
      config: {
        innerRadius: 50, showLabels: false, showLegend: true, data: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          groupBy: { entity: 'appointment_patient', field: 'payor_type' },
          valueAgg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filterGroups: [orGroup('g1', [
            { entity: 'appointment', field: 'status', operator: FilterOperator.Eq, value: 'no_show'   },
            { entity: 'appointment', field: 'status', operator: FilterOperator.Eq, value: 'cancelled' },
          ])],
        },
      },
    },
    // [two groups — line] (completed OR confirmed) AND (price>=100) monthly
    {
      ...FACTORIES[WidgetType.Line](5, 14),
      w: 7, h: 3,
      title: 'Two Groups — (Completed|Confirmed) AND High-Value by Month',
      config: {
        areaFill: true, smooth: true, showGrid: true, showDots: false, showLegend: false,
        series: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient'],
          dateAxis: { entity: 'appointment', field: 'start_date', interval: DateInterval.Month },
          valueAgg: { entity: 'appointment_patient', field: 'appointment_id', function: AggregationFunction.Count },
          filterGroups: [
            orGroup('g1',  [
              { entity: 'appointment', field: 'status', operator: FilterOperator.Eq, value: 'completed' },
              { entity: 'appointment', field: 'status', operator: FilterOperator.Eq, value: 'confirmed' },
            ]),
            andGroup('g2', [
              { entity: 'appointment_patient', field: 'price', operator: FilterOperator.Gte, value: 100 },
            ]),
          ],
          dateRangeField: { entity: 'appointment', field: 'start_date' },
        },
      },
    },
    // [two groups — table] (completed OR confirmed) AND (price>=100 AND rating IS NOT NULL)
    {
      ...FACTORIES[WidgetType.Table](0, 17),
      w: 12, h: 3,
      title: 'Two Groups — (Completed|Confirmed) AND (Price ≥ £100 AND Rated)',
      config: {
        striped: true, compact: false, statusColumn: true,
        columns: [], rows: [], selectedFields: [],
        queryConfig: {
          product: 'epx',
          entities: ['appointment', 'appointment_patient', 'contact'],
          columns: [
            { entity: 'appointment',         field: 'identifier'    },
            { entity: 'appointment',         field: 'start_date'    },
            { entity: 'appointment',         field: 'status'        },
            { entity: 'appointment',         field: 'site_id'       },
            { entity: 'appointment',         field: 'is_remote'     },
            { entity: 'appointment_patient', field: 'payor_type'    },
            { entity: 'appointment_patient', field: 'price'         },
            { entity: 'appointment_patient', field: 'rating'        },
            { entity: 'contact',             field: 'firstname'     },
            { entity: 'contact',             field: 'lastname'      },
          ],
          filterGroups: [
            orGroup('g1',  [
              { entity: 'appointment', field: 'status', operator: FilterOperator.Eq, value: 'completed' },
              { entity: 'appointment', field: 'status', operator: FilterOperator.Eq, value: 'confirmed' },
            ]),
            andGroup('g2', [
              { entity: 'appointment_patient', field: 'price',  operator: FilterOperator.Gte, value: 100 },
              { entity: 'appointment_patient', field: 'rating', operator: FilterOperator.IsNotNull },
            ]),
          ],
          sort: { entity: 'appointment_patient', field: 'rating', direction: SortDirection.Desc },
          pageSize: 20,
          dateRangeField: { entity: 'appointment', field: 'start_date' },
        },
      },
    },
  ];
}


// ───────────────────────────────────────────────────────────────
//  ACCOUNTING — AND/OR FILTER GROUPS SHOWCASE
//  Demonstrates: AND groups, OR groups, two-group combinations,
//  charts and tables on invoice/payment/claim data
// ───────────────────────────────────────────────────────────────

function buildAccountingFilterGroups(): Widget[] {
  const andGroup  = (id: string, conditions: FilterGroup['conditions']): FilterGroup => ({ id, logic: 'AND', conditions });
  const orGroup   = (id: string, conditions: FilterGroup['conditions']): FilterGroup => ({ id, logic: 'OR',  conditions });

  return [
    // ── Section header ─────────────────────────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 0),
      title: 'Section',
      config: { label: 'Accounting — AND / OR Filter Groups', accent: '#10b981', showLine: true, align: TextAlign.Left },
    },

    // ── Section A: Single AND Group ────────────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 1),
      title: 'Section',
      config: { label: 'Section A — Single AND Group', accent: '#10b981', showLine: false, align: TextAlign.Left },
    },

    // [AND] paid AND high-value
    {
      ...FACTORIES[WidgetType.Stat](0, 2),
      title: 'Paid AND High-Value (≥ £300)',
      config: {
        value: '–', subValue: 'status=paid AND total_amount≥300', trend: '', trendUp: true,
        accent: '#10b981', prefix: '', suffix: '',
        description: 'AND group: fully paid invoices that also exceed £300 — high-value revenue confirmed',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'id', function: AggregationFunction.Count },
          filterGroups: [andGroup('g1', [
            { entity: 'invoice', field: 'status',       operator: FilterOperator.Eq,  value: 'paid' },
            { entity: 'invoice', field: 'total_amount', operator: FilterOperator.Gte, value: 300 },
          ])],
          periodLabel: 'AND group',
        },
      },
    },
    // [AND] overdue AND write-off exists
    {
      ...FACTORIES[WidgetType.Stat](3, 2),
      title: 'Overdue AND Written-Off',
      config: {
        value: '–', subValue: 'status=overdue AND write_off IS NOT NULL', trend: '', trendUp: false,
        accent: '#ef4444', prefix: '', suffix: '',
        description: 'AND group: overdue invoices that already have a partial write-off — high-risk collection cases',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'id', function: AggregationFunction.Count },
          filterGroups: [andGroup('g1', [
            { entity: 'invoice', field: 'status',           operator: FilterOperator.Eq,        value: 'overdue' },
            { entity: 'invoice', field: 'write_off_amount', operator: FilterOperator.IsNotNull },
          ])],
          periodLabel: 'AND group',
        },
      },
    },
    // [AND] not-void AND large amount
    {
      ...FACTORIES[WidgetType.Stat](6, 2),
      title: 'Active AND Large (≥ £400)',
      config: {
        value: '–', subValue: 'is_void=false AND total_amount≥400', trend: '', trendUp: true,
        accent: '#f59e0b', prefix: '£', suffix: '',
        description: 'AND group: non-void invoices with very large amounts — premium billing activity',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'total_amount', function: AggregationFunction.Sum },
          filterGroups: [andGroup('g1', [
            { entity: 'invoice', field: 'is_void',      operator: FilterOperator.Eq,  value: 'false' },
            { entity: 'invoice', field: 'total_amount', operator: FilterOperator.Gte, value: 400 },
          ])],
          periodLabel: 'AND group',
        },
      },
    },
    // [AND] cleared payment AND partial
    {
      ...FACTORIES[WidgetType.Stat](9, 2),
      title: 'Cleared AND Partial Payment',
      config: {
        value: '–', subValue: 'status=cleared AND is_partial=true', trend: '', trendUp: true,
        accent: '#06b6d4', prefix: '', suffix: '',
        description: 'AND group on payment entity: payment cleared by bank but flagged as partial — instalment tracking',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice', 'payment'],
          agg: { entity: 'payment', field: 'id', function: AggregationFunction.Count },
          filterGroups: [andGroup('g1', [
            { entity: 'payment', field: 'status',     operator: FilterOperator.Eq, value: 'cleared' },
            { entity: 'payment', field: 'is_partial', operator: FilterOperator.Eq, value: 'true'   },
          ])],
          periodLabel: 'AND group',
        },
      },
    },

    // ── Section B: Single OR Group ─────────────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 4),
      title: 'Section',
      config: { label: 'Section B — Single OR Group', accent: '#f59e0b', showLine: false, align: TextAlign.Left },
    },

    // [OR] paid OR partial (collected revenue)
    {
      ...FACTORIES[WidgetType.Stat](0, 5),
      title: 'Paid OR Partial',
      config: {
        value: '–', subValue: 'status=paid OR status=partial', trend: '', trendUp: true,
        accent: '#10b981', prefix: '', suffix: '',
        description: 'OR group: all invoices with any payment activity — fully paid OR partially settled',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'id', function: AggregationFunction.Count },
          filterGroups: [orGroup('g1', [
            { entity: 'invoice', field: 'status', operator: FilterOperator.Eq, value: 'paid'    },
            { entity: 'invoice', field: 'status', operator: FilterOperator.Eq, value: 'partial' },
          ])],
          periodLabel: 'OR group',
        },
      },
    },
    // [OR] overdue OR pending (unpaid workload)
    {
      ...FACTORIES[WidgetType.Stat](3, 5),
      title: 'Overdue OR Pending',
      config: {
        value: '–', subValue: 'status=overdue OR status=pending', trend: '', trendUp: false,
        accent: '#f97316', prefix: '', suffix: '',
        description: 'OR group: total unpaid workload — invoices that are overdue OR still pending payment',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'id', function: AggregationFunction.Count },
          filterGroups: [orGroup('g1', [
            { entity: 'invoice', field: 'status', operator: FilterOperator.Eq, value: 'overdue' },
            { entity: 'invoice', field: 'status', operator: FilterOperator.Eq, value: 'pending' },
          ])],
          periodLabel: 'OR group',
        },
      },
    },
    // [OR] consultation OR procedure (clinical invoice types)
    {
      ...FACTORIES[WidgetType.Stat](6, 5),
      title: 'Consultation OR Procedure',
      config: {
        value: '–', subValue: 'type=consultation OR type=procedure', trend: '', trendUp: true,
        accent: '#6366f1', prefix: '', suffix: '',
        description: 'OR group: clinical invoice types — direct patient treatment billing (excludes NHS/insurance admin)',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'id', function: AggregationFunction.Count },
          filterGroups: [orGroup('g1', [
            { entity: 'invoice', field: 'invoice_type', operator: FilterOperator.Eq, value: 'consultation' },
            { entity: 'invoice', field: 'invoice_type', operator: FilterOperator.Eq, value: 'procedure'    },
          ])],
          periodLabel: 'OR group',
        },
      },
    },
    // [OR] cleared OR pending payments
    {
      ...FACTORIES[WidgetType.Stat](9, 5),
      title: 'Cleared OR Pending Payments',
      config: {
        value: '–', subValue: 'pmt status=cleared OR status=pending', trend: '', trendUp: true,
        accent: '#22c55e', prefix: '', suffix: '',
        description: 'OR group on payment: active payment records — cleared (confirmed) OR pending (in-flight)',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice', 'payment'],
          agg: { entity: 'payment', field: 'id', function: AggregationFunction.Count },
          filterGroups: [orGroup('g1', [
            { entity: 'payment', field: 'status', operator: FilterOperator.Eq, value: 'cleared' },
            { entity: 'payment', field: 'status', operator: FilterOperator.Eq, value: 'pending' },
          ])],
          periodLabel: 'OR group',
        },
      },
    },

    // ── Section C: Two Groups ──────────────────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 7),
      title: 'Section',
      config: { label: 'Section C — Two Filter Groups: (Group1) AND (Group2)', accent: '#ec4899', showLine: false, align: TextAlign.Left },
    },

    // [OR-group AND AND-group] (paid OR partial) AND total>=200
    {
      ...FACTORIES[WidgetType.Stat](0, 8),
      title: '(Paid OR Partial) AND Amount ≥ £200',
      config: {
        value: '–', subValue: '(paid|partial) AND total≥200', trend: '', trendUp: true,
        accent: '#10b981', prefix: '', suffix: '',
        description: 'Two groups: OR-group captures collected invoices; AND-group enforces £200 minimum — significant settled billing',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'id', function: AggregationFunction.Count },
          filterGroups: [
            orGroup('g1',  [
              { entity: 'invoice', field: 'status', operator: FilterOperator.Eq, value: 'paid'    },
              { entity: 'invoice', field: 'status', operator: FilterOperator.Eq, value: 'partial' },
            ]),
            andGroup('g2', [
              { entity: 'invoice', field: 'total_amount', operator: FilterOperator.Gte, value: 200 },
            ]),
          ],
          periodLabel: 'OR AND combined',
        },
      },
    },
    // [OR-group AND AND-group] (overdue OR pending) AND NOT void
    {
      ...FACTORIES[WidgetType.Stat](4, 8),
      title: '(Overdue OR Pending) AND Not Void',
      config: {
        value: '–', subValue: '(overdue|pending) AND is_void=false', trend: '', trendUp: false,
        accent: '#ef4444', prefix: '', suffix: '',
        description: 'Two groups: OR-group captures unpaid invoices; AND-group excludes voided records — actionable debt',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'id', function: AggregationFunction.Count },
          filterGroups: [
            orGroup('g1',  [
              { entity: 'invoice', field: 'status', operator: FilterOperator.Eq, value: 'overdue' },
              { entity: 'invoice', field: 'status', operator: FilterOperator.Eq, value: 'pending' },
            ]),
            andGroup('g2', [
              { entity: 'invoice', field: 'is_void', operator: FilterOperator.Eq, value: 'false' },
            ]),
          ],
          periodLabel: 'OR AND combined',
        },
      },
    },
    // [AND-group AND AND-group] (consultation OR procedure) AND large AND not-void
    {
      ...FACTORIES[WidgetType.Stat](8, 8),
      title: '(Consult|Procedure) AND Large AND Active',
      config: {
        value: '–', subValue: '(consult|procedure) AND ≥300 AND is_void=false', trend: '', trendUp: true,
        accent: '#6366f1', prefix: '£', suffix: '',
        description: 'Two groups: OR-group picks clinical types; AND-group enforces ≥£300 and not-void — premium clinical revenue pipeline',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          agg: { entity: 'invoice', field: 'total_amount', function: AggregationFunction.Sum },
          filterGroups: [
            orGroup('g1',  [
              { entity: 'invoice', field: 'invoice_type', operator: FilterOperator.Eq, value: 'consultation' },
              { entity: 'invoice', field: 'invoice_type', operator: FilterOperator.Eq, value: 'procedure'    },
            ]),
            andGroup('g2', [
              { entity: 'invoice', field: 'total_amount', operator: FilterOperator.Gte, value: 300 },
              { entity: 'invoice', field: 'is_void',      operator: FilterOperator.Eq,  value: 'false' },
            ]),
          ],
          periodLabel: 'OR AND combined',
        },
      },
    },

    // ── Section D: Charts & Table ──────────────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 10),
      title: 'Section',
      config: { label: 'Section D — Charts & Table with Filter Groups', accent: '#10b981', showLine: false, align: TextAlign.Left },
    },

    // [OR group bar] (paid OR partial) by invoice_type
    {
      ...FACTORIES[WidgetType.Bar](0, 11),
      w: 6, h: 3,
      title: 'OR Group — Collected Invoices by Type',
      config: {
        accent: '#10b981', stacked: false, horizontal: true,
        showGrid: true, showLegend: false, series: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          groupBy: { entity: 'invoice', field: 'invoice_type' },
          valueAgg: { entity: 'invoice', field: 'id', function: AggregationFunction.Count },
          filterGroups: [orGroup('g1', [
            { entity: 'invoice', field: 'status', operator: FilterOperator.Eq, value: 'paid'    },
            { entity: 'invoice', field: 'status', operator: FilterOperator.Eq, value: 'partial' },
          ])],
        },
      },
    },
    // [AND group line] (overdue AND write-off) by month
    {
      ...FACTORIES[WidgetType.Line](6, 11),
      w: 6, h: 3,
      title: 'AND Group — Overdue With Write-Off by Month',
      config: {
        areaFill: false, smooth: true, showGrid: true, showDots: true, showLegend: false,
        series: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          dateAxis: { entity: 'invoice', field: 'invoice_date', interval: DateInterval.Month },
          valueAgg: { entity: 'invoice', field: 'id', function: AggregationFunction.Count },
          filterGroups: [andGroup('g1', [
            { entity: 'invoice', field: 'status',           operator: FilterOperator.Eq,        value: 'overdue' },
            { entity: 'invoice', field: 'write_off_amount', operator: FilterOperator.IsNotNull },
          ])],
          dateRangeField: { entity: 'invoice', field: 'invoice_date' },
        },
      },
    },
    // [OR group pie] (overdue OR pending) by invoice_type
    {
      ...FACTORIES[WidgetType.Pie](0, 14),
      w: 5, h: 3,
      title: 'OR Group — Unpaid by Invoice Type',
      config: {
        innerRadius: 50, showLabels: false, showLegend: true, data: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          groupBy: { entity: 'invoice', field: 'invoice_type' },
          valueAgg: { entity: 'invoice', field: 'total_amount', function: AggregationFunction.Sum },
          filterGroups: [orGroup('g1', [
            { entity: 'invoice', field: 'status', operator: FilterOperator.Eq, value: 'overdue' },
            { entity: 'invoice', field: 'status', operator: FilterOperator.Eq, value: 'pending' },
          ])],
        },
      },
    },
    // [two groups line] (paid OR partial) AND large by month
    {
      ...FACTORIES[WidgetType.Line](5, 14),
      w: 7, h: 3,
      title: 'Two Groups — Collected High-Value Invoices by Month',
      config: {
        areaFill: true, smooth: true, showGrid: true, showDots: false, showLegend: false,
        series: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          dateAxis: { entity: 'invoice', field: 'invoice_date', interval: DateInterval.Month },
          valueAgg: { entity: 'invoice', field: 'total_amount', function: AggregationFunction.Sum },
          filterGroups: [
            orGroup('g1',  [
              { entity: 'invoice', field: 'status', operator: FilterOperator.Eq, value: 'paid'    },
              { entity: 'invoice', field: 'status', operator: FilterOperator.Eq, value: 'partial' },
            ]),
            andGroup('g2', [
              { entity: 'invoice', field: 'total_amount', operator: FilterOperator.Gte, value: 200 },
            ]),
          ],
          dateRangeField: { entity: 'invoice', field: 'invoice_date' },
        },
      },
    },
    // [two groups table] (overdue OR pending) AND (not-void AND large)
    {
      ...FACTORIES[WidgetType.Table](0, 17),
      w: 12, h: 3,
      title: 'Two Groups — (Overdue|Pending) AND (Active, Amount ≥ £200)',
      config: {
        striped: true, compact: false, statusColumn: true,
        columns: [], rows: [], selectedFields: [],
        queryConfig: {
          product: 'accounting',
          entities: ['invoice'],
          columns: [
            { entity: 'invoice', field: 'invoice_number'   },
            { entity: 'invoice', field: 'invoice_date'     },
            { entity: 'invoice', field: 'status'           },
            { entity: 'invoice', field: 'invoice_type'     },
            { entity: 'invoice', field: 'total_amount'     },
            { entity: 'invoice', field: 'paid_amount'      },
            { entity: 'invoice', field: 'write_off_amount' },
            { entity: 'invoice', field: 'site_id'          },
            { entity: 'invoice', field: 'notes'            },
          ],
          filterGroups: [
            orGroup('g1',  [
              { entity: 'invoice', field: 'status', operator: FilterOperator.Eq, value: 'overdue' },
              { entity: 'invoice', field: 'status', operator: FilterOperator.Eq, value: 'pending' },
            ]),
            andGroup('g2', [
              { entity: 'invoice', field: 'is_void',      operator: FilterOperator.Eq,  value: 'false' },
              { entity: 'invoice', field: 'total_amount', operator: FilterOperator.Gte, value: 200 },
            ]),
          ],
          sort: { entity: 'invoice', field: 'invoice_date', direction: SortDirection.Desc },
          pageSize: 20,
          dateRangeField: { entity: 'invoice', field: 'invoice_date' },
        },
      },
    },
  ];
}


// ───────────────────────────────────────────────────────────────
//  PRESCRIPTIONS — AND/OR FILTER GROUPS SHOWCASE
//  Demonstrates: AND/OR groups and two-group combinations on
//  prescription/medication/dispense data — priority field for
//  compelling OR examples (emergency, urgent, routine)
// ───────────────────────────────────────────────────────────────

function buildPrescriptionsFilterGroups(): Widget[] {
  const andGroup  = (id: string, conditions: FilterGroup['conditions']): FilterGroup => ({ id, logic: 'AND', conditions });
  const orGroup   = (id: string, conditions: FilterGroup['conditions']): FilterGroup => ({ id, logic: 'OR',  conditions });

  return [
    // ── Section header ─────────────────────────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 0),
      title: 'Section',
      config: { label: 'Prescriptions — AND / OR Filter Groups', accent: '#a78bfa', showLine: true, align: TextAlign.Left },
    },

    // ── Section A: Single AND Group ────────────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 1),
      title: 'Section',
      config: { label: 'Section A — Single AND Group', accent: '#a78bfa', showLine: false, align: TextAlign.Left },
    },

    // [AND] active AND repeat
    {
      ...FACTORIES[WidgetType.Stat](0, 2),
      title: 'Active AND Repeat',
      config: {
        value: '–', subValue: 'status=active AND is_repeat=true', trend: '', trendUp: true,
        accent: '#10b981', prefix: '', suffix: '',
        description: 'AND group: currently active prescriptions that are repeat scripts — chronic medication management workload',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          agg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filterGroups: [andGroup('g1', [
            { entity: 'prescription', field: 'status',    operator: FilterOperator.Eq, value: 'active' },
            { entity: 'prescription', field: 'is_repeat', operator: FilterOperator.Eq, value: 'true'   },
          ])],
          periodLabel: 'AND group',
        },
      },
    },
    // [AND] urgent AND controlled
    {
      ...FACTORIES[WidgetType.Stat](3, 2),
      title: 'Urgent AND Controlled Drug',
      config: {
        value: '–', subValue: 'priority=urgent AND is_controlled=true', trend: '', trendUp: false,
        accent: '#f59e0b', prefix: '', suffix: '',
        description: 'AND group across entities: prescription must be urgent priority AND the medication is a controlled substance',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription', 'prescription_item', 'medication'],
          agg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filterGroups: [andGroup('g1', [
            { entity: 'prescription', field: 'priority',      operator: FilterOperator.Eq, value: 'urgent' },
            { entity: 'medication',   field: 'is_controlled', operator: FilterOperator.Eq, value: 'true'  },
          ])],
          periodLabel: 'AND group',
        },
      },
    },
    // [AND] dispensed AND long-course
    {
      ...FACTORIES[WidgetType.Stat](6, 2),
      title: 'Dispensed AND Long-Course (≥ 28 days)',
      config: {
        value: '–', subValue: 'status=dispensed AND duration_days≥28', trend: '', trendUp: true,
        accent: '#6366f1', prefix: '', suffix: '',
        description: 'AND group: dispensed prescriptions with a duration of ≥28 days — chronic/long-term treatment tracking',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription', 'prescription_item'],
          agg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filterGroups: [andGroup('g1', [
            { entity: 'prescription',      field: 'status',        operator: FilterOperator.Eq,  value: 'dispensed' },
            { entity: 'prescription_item', field: 'duration_days', operator: FilterOperator.Gte, value: 28 },
          ])],
          periodLabel: 'AND group',
        },
      },
    },
    // [AND] emergency AND annotated
    {
      ...FACTORIES[WidgetType.Stat](9, 2),
      title: 'Emergency AND Has Notes',
      config: {
        value: '–', subValue: 'priority=emergency AND notes IS NOT NULL', trend: '', trendUp: false,
        accent: '#ef4444', prefix: '', suffix: '',
        description: 'AND group: emergency prescriptions that have clinical notes attached — high-risk documented cases',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          agg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filterGroups: [andGroup('g1', [
            { entity: 'prescription', field: 'priority', operator: FilterOperator.Eq,        value: 'emergency' },
            { entity: 'prescription', field: 'notes',    operator: FilterOperator.IsNotNull },
          ])],
          periodLabel: 'AND group',
        },
      },
    },

    // ── Section B: Single OR Group ─────────────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 4),
      title: 'Section',
      config: { label: 'Section B — Single OR Group', accent: '#f59e0b', showLine: false, align: TextAlign.Left },
    },

    // [OR] emergency OR urgent (high-priority alert)
    {
      ...FACTORIES[WidgetType.Stat](0, 5),
      title: 'Emergency OR Urgent',
      config: {
        value: '–', subValue: 'priority=emergency OR priority=urgent', trend: '', trendUp: false,
        accent: '#ef4444', prefix: '', suffix: '',
        description: 'OR group: all elevated-priority prescriptions — either emergency (3) or urgent (7) — clinical workload alert',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          agg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filterGroups: [orGroup('g1', [
            { entity: 'prescription', field: 'priority', operator: FilterOperator.Eq, value: 'emergency' },
            { entity: 'prescription', field: 'priority', operator: FilterOperator.Eq, value: 'urgent'    },
          ])],
          periodLabel: 'OR group',
        },
      },
    },
    // [OR] expired OR cancelled (inactive prescriptions)
    {
      ...FACTORIES[WidgetType.Stat](3, 5),
      title: 'Expired OR Cancelled',
      config: {
        value: '–', subValue: 'status=expired OR status=cancelled', trend: '', trendUp: false,
        accent: '#6b7280', prefix: '', suffix: '',
        description: 'OR group: all inactive prescriptions — either expired naturally or explicitly cancelled',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          agg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filterGroups: [orGroup('g1', [
            { entity: 'prescription', field: 'status', operator: FilterOperator.Eq, value: 'expired'   },
            { entity: 'prescription', field: 'status', operator: FilterOperator.Eq, value: 'cancelled' },
          ])],
          periodLabel: 'OR group',
        },
      },
    },
    // [OR] active OR dispensed (in-care)
    {
      ...FACTORIES[WidgetType.Stat](6, 5),
      title: 'Active OR Dispensed',
      config: {
        value: '–', subValue: 'status=active OR status=dispensed', trend: '', trendUp: true,
        accent: '#22c55e', prefix: '', suffix: '',
        description: 'OR group: prescriptions currently in care — either active (waiting dispense) OR already dispensed',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          agg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filterGroups: [orGroup('g1', [
            { entity: 'prescription', field: 'status', operator: FilterOperator.Eq, value: 'active'    },
            { entity: 'prescription', field: 'status', operator: FilterOperator.Eq, value: 'dispensed' },
          ])],
          periodLabel: 'OR group',
        },
      },
    },
    // [OR] controlled OR emergency (special handling)
    {
      ...FACTORIES[WidgetType.Stat](9, 5),
      title: 'Controlled Drug OR Emergency Priority',
      config: {
        value: '–', subValue: 'is_controlled=true OR priority=emergency', trend: '', trendUp: false,
        accent: '#dc2626', prefix: '', suffix: '',
        description: 'OR group across entities: controlled substance OR emergency priority — any special-handling prescription',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription', 'prescription_item', 'medication'],
          agg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filterGroups: [orGroup('g1', [
            { entity: 'medication',   field: 'is_controlled', operator: FilterOperator.Eq, value: 'true'      },
            { entity: 'prescription', field: 'priority',      operator: FilterOperator.Eq, value: 'emergency' },
          ])],
          periodLabel: 'OR group',
        },
      },
    },

    // ── Section C: Two Groups ──────────────────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 7),
      title: 'Section',
      config: { label: 'Section C — Two Filter Groups: (Group1) AND (Group2)', accent: '#ec4899', showLine: false, align: TextAlign.Left },
    },

    // [OR-group AND AND-group] (emergency OR urgent) AND controlled
    {
      ...FACTORIES[WidgetType.Stat](0, 8),
      title: '(Emergency OR Urgent) AND Controlled',
      config: {
        value: '–', subValue: '(emergency|urgent) AND is_controlled=true', trend: '', trendUp: false,
        accent: '#ef4444', prefix: '', suffix: '',
        description: 'Two groups: OR-group captures high-priority; AND-group restricts to controlled substances — highest-risk scripts',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription', 'prescription_item', 'medication'],
          agg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filterGroups: [
            orGroup('g1',  [
              { entity: 'prescription', field: 'priority', operator: FilterOperator.Eq, value: 'emergency' },
              { entity: 'prescription', field: 'priority', operator: FilterOperator.Eq, value: 'urgent'    },
            ]),
            andGroup('g2', [
              { entity: 'medication', field: 'is_controlled', operator: FilterOperator.Eq, value: 'true' },
            ]),
          ],
          periodLabel: 'OR AND combined',
        },
      },
    },
    // [OR-group AND AND-group] (active OR dispensed) AND repeat
    {
      ...FACTORIES[WidgetType.Stat](4, 8),
      title: '(Active OR Dispensed) AND Repeat Script',
      config: {
        value: '–', subValue: '(active|dispensed) AND is_repeat=true', trend: '', trendUp: true,
        accent: '#10b981', prefix: '', suffix: '',
        description: 'Two groups: OR-group picks live prescriptions; AND-group restricts to repeat scripts — ongoing chronic prescribing',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          agg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filterGroups: [
            orGroup('g1',  [
              { entity: 'prescription', field: 'status', operator: FilterOperator.Eq, value: 'active'    },
              { entity: 'prescription', field: 'status', operator: FilterOperator.Eq, value: 'dispensed' },
            ]),
            andGroup('g2', [
              { entity: 'prescription', field: 'is_repeat', operator: FilterOperator.Eq, value: 'true' },
            ]),
          ],
          periodLabel: 'OR AND combined',
        },
      },
    },
    // [AND-group AND AND-group] (emergency AND controlled) AND has notes
    {
      ...FACTORIES[WidgetType.Stat](8, 8),
      title: 'Emergency AND Controlled AND Annotated',
      config: {
        value: '–', subValue: '(emergency AND controlled) AND notes IS NOT NULL', trend: '', trendUp: false,
        accent: '#dc2626', prefix: '', suffix: '',
        description: 'Two AND groups: Group1 targets emergency controlled scripts; Group2 requires clinical notes — fully documented critical cases',
        showSparkline: false, sparkData: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription', 'prescription_item', 'medication'],
          agg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filterGroups: [
            andGroup('g1', [
              { entity: 'prescription', field: 'priority',      operator: FilterOperator.Eq, value: 'emergency' },
              { entity: 'medication',   field: 'is_controlled', operator: FilterOperator.Eq, value: 'true'      },
            ]),
            andGroup('g2', [
              { entity: 'prescription', field: 'notes', operator: FilterOperator.IsNotNull },
            ]),
          ],
          periodLabel: 'AND + AND groups',
        },
      },
    },

    // ── Section D: Charts & Table ──────────────────────────────
    {
      ...FACTORIES[WidgetType.Section](0, 10),
      title: 'Section',
      config: { label: 'Section D — Charts & Table with Filter Groups', accent: '#a78bfa', showLine: false, align: TextAlign.Left },
    },

    // [OR group bar] (emergency OR urgent) by site
    {
      ...FACTORIES[WidgetType.Bar](0, 11),
      w: 6, h: 3,
      title: 'OR Group — High-Priority Rx by Site',
      config: {
        accent: '#f59e0b', stacked: false, horizontal: true,
        showGrid: true, showLegend: false, series: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          groupBy: { entity: 'prescription', field: 'site_id' },
          valueAgg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filterGroups: [orGroup('g1', [
            { entity: 'prescription', field: 'priority', operator: FilterOperator.Eq, value: 'emergency' },
            { entity: 'prescription', field: 'priority', operator: FilterOperator.Eq, value: 'urgent'    },
          ])],
        },
      },
    },
    // [AND group line] (active AND repeat) by month
    {
      ...FACTORIES[WidgetType.Line](6, 11),
      w: 6, h: 3,
      title: 'AND Group — Active Repeat Scripts by Month',
      config: {
        areaFill: false, smooth: true, showGrid: true, showDots: true, showLegend: false,
        series: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription'],
          dateAxis: { entity: 'prescription', field: 'prescribed_date', interval: DateInterval.Month },
          valueAgg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filterGroups: [andGroup('g1', [
            { entity: 'prescription', field: 'status',    operator: FilterOperator.Eq, value: 'active' },
            { entity: 'prescription', field: 'is_repeat', operator: FilterOperator.Eq, value: 'true'   },
          ])],
          dateRangeField: { entity: 'prescription', field: 'prescribed_date' },
        },
      },
    },
    // [OR group pie] (emergency OR urgent) by drug_class
    {
      ...FACTORIES[WidgetType.Pie](0, 14),
      w: 5, h: 3,
      title: 'OR Group — High-Priority Rx by Drug Class',
      config: {
        innerRadius: 50, showLabels: false, showLegend: true, data: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription', 'prescription_item', 'medication'],
          groupBy: { entity: 'medication', field: 'drug_class' },
          valueAgg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filterGroups: [orGroup('g1', [
            { entity: 'prescription', field: 'priority', operator: FilterOperator.Eq, value: 'emergency' },
            { entity: 'prescription', field: 'priority', operator: FilterOperator.Eq, value: 'urgent'    },
          ])],
        },
      },
    },
    // [two groups line] (emergency OR urgent) AND controlled by month
    {
      ...FACTORIES[WidgetType.Line](5, 14),
      w: 7, h: 3,
      title: 'Two Groups — High-Priority Controlled Scripts by Month',
      config: {
        areaFill: true, smooth: true, showGrid: true, showDots: false, showLegend: false,
        series: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription', 'prescription_item', 'medication'],
          dateAxis: { entity: 'prescription', field: 'prescribed_date', interval: DateInterval.Month },
          valueAgg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
          filterGroups: [
            orGroup('g1',  [
              { entity: 'prescription', field: 'priority', operator: FilterOperator.Eq, value: 'emergency' },
              { entity: 'prescription', field: 'priority', operator: FilterOperator.Eq, value: 'urgent'    },
            ]),
            andGroup('g2', [
              { entity: 'medication', field: 'is_controlled', operator: FilterOperator.Eq, value: 'true' },
            ]),
          ],
          dateRangeField: { entity: 'prescription', field: 'prescribed_date' },
        },
      },
    },
    // [two groups table] (active OR dispensed) AND (repeat AND controlled)
    {
      ...FACTORIES[WidgetType.Table](0, 17),
      w: 12, h: 3,
      title: 'Two Groups — (Active|Dispensed) AND (Repeat AND Controlled)',
      config: {
        striped: true, compact: false, statusColumn: true,
        columns: [], rows: [], selectedFields: [],
        queryConfig: {
          product: 'prescriptions',
          entities: ['prescription', 'prescription_item', 'medication'],
          columns: [
            { entity: 'prescription',      field: 'prescription_number' },
            { entity: 'prescription',      field: 'prescribed_date'     },
            { entity: 'prescription',      field: 'status'              },
            { entity: 'prescription',      field: 'priority'            },
            { entity: 'prescription',      field: 'is_repeat'           },
            { entity: 'prescription',      field: 'repeat_count'        },
            { entity: 'prescription_item', field: 'duration_days'       },
            { entity: 'medication',        field: 'name'                },
            { entity: 'medication',        field: 'drug_class'          },
            { entity: 'medication',        field: 'is_controlled'       },
          ],
          filterGroups: [
            orGroup('g1',  [
              { entity: 'prescription', field: 'status', operator: FilterOperator.Eq, value: 'active'    },
              { entity: 'prescription', field: 'status', operator: FilterOperator.Eq, value: 'dispensed' },
            ]),
            andGroup('g2', [
              { entity: 'prescription', field: 'is_repeat',           operator: FilterOperator.Eq, value: 'true' },
              { entity: 'medication',   field: 'is_controlled',       operator: FilterOperator.Eq, value: 'true' },
            ]),
          ],
          sort: { entity: 'prescription', field: 'prescribed_date', direction: SortDirection.Desc },
          pageSize: 20,
          dateRangeField: { entity: 'prescription', field: 'prescribed_date' },
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
  {
    id:          'agg-showcase',
    name:        'Aggregation Functions',
    description: 'COUNT, COUNT_DISTINCT, SUM, AVG, MIN, MAX — each widget annotated with the function it demonstrates',
    icon:        '∑',
    color:       '#6366f1',
    build:       buildAggregations,
  },
  {
    id:          'filter-showcase',
    name:        'Filter Operations',
    description: 'eq, neq, gt, gte, lt, lte, is_null, is_not_null, in, not_in, contains — one widget per operator',
    icon:        '⊗',
    color:       '#ec4899',
    build:       buildFilterOps,
  },
  {
    id:          'accounting-agg-showcase',
    name:        'Accounting — Aggregation Functions',
    description: 'COUNT, COUNT_DISTINCT, SUM, AVG, MIN, MAX on invoice/payment/claim data — write_off_amount demonstrates nullable aggregation',
    icon:        '∑',
    color:       '#10b981',
    build:       buildAccountingAggregations,
  },
  {
    id:          'accounting-filter-showcase',
    name:        'Accounting — Filter Operations',
    description: 'eq, neq, gt, gte, lt, lte, is_null, is_not_null, in, not_in, contains on invoice/payment/claim entities',
    icon:        '⊗',
    color:       '#10b981',
    build:       buildAccountingFilterOps,
  },
  {
    id:          'prescriptions-agg-showcase',
    name:        'Prescriptions — Aggregation Functions',
    description: 'COUNT, COUNT_DISTINCT, SUM, AVG, MIN, MAX on prescription/medication/dispense data — repeat_count dilution and duration extremes',
    icon:        '∑',
    color:       '#a78bfa',
    build:       buildPrescriptionsAggregations,
  },
  {
    id:          'prescriptions-filter-showcase',
    name:        'Prescriptions — Filter Operations',
    description: 'eq, neq, gt, gte, lt, lte, is_null, is_not_null, in, not_in, contains on prescription/medication/dispense entities — priority field for IN/NOT_IN demos',
    icon:        '⊗',
    color:       '#a78bfa',
    build:       buildPrescriptionsFilterOps,
  },
  {
    id:          'epx-filter-groups',
    name:        'EPX — AND / OR Filter Groups',
    description: 'Single AND groups, single OR groups, two-group combinations — charts and tables for all patterns',
    icon:        '⊕',
    color:       '#3b82f6',
    build:       buildEpxFilterGroups,
  },
  {
    id:          'accounting-filter-groups',
    name:        'Accounting — AND / OR Filter Groups',
    description: 'AND/OR filter groups on invoice/payment data — paid|partial OR, overdue|pending OR, two-group AND combinations',
    icon:        '⊕',
    color:       '#10b981',
    build:       buildAccountingFilterGroups,
  },
  {
    id:          'prescriptions-filter-groups',
    name:        'Prescriptions — AND / OR Filter Groups',
    description: 'AND/OR filter groups on prescription/medication — priority OR (emergency|urgent), controlled AND, two-group combinations',
    icon:        '⊕',
    color:       '#a78bfa',
    build:       buildPrescriptionsFilterGroups,
  },
  {
    id:          'patient-roster',
    name:        'Patient Roster',
    description: 'Patient demographics, active/sex breakdown, address & telecom joins, is_primary filter, LEFT JOIN nulls',
    icon:        '👤',
    color:       '#06b6d4',
    build:       buildPatientRoster,
  },
  {
    id:          'appointment-quality',
    name:        'Appointment Quality',
    description: 'AVG/MIN/MAX rating, IS_NULL/IS_NOT_NULL, boolean is_remote filter, attendance status, top-rated table',
    icon:        '⭐',
    color:       '#f97316',
    build:       buildAppointmentQuality,
  },
  {
    id:          'site-performance',
    name:        'Site Performance',
    description: 'Per-site COUNT/SUM/AVG stats, cross-site groupBy, multi-series line chart, full appointment detail table',
    icon:        '🏢',
    color:       '#f59e0b',
    build:       buildSitePerformance,
  },
];
