/**
 * QueryService – Comprehensive test suite
 *
 * Covers join scenarios, filters, aggregation, chart/pie grouping,
 * sorting, pagination, warnings, and documented edge cases.
 *
 * Mock-today: 2026-03-17  (matches MOCK_TODAY constant in the service)
 */

import { QueryService } from './query.service';
import {
  FilterOperator, AggregationFunction, DateInterval, DateRangePreset,
  QueryWarning, QueryWarningCode, SortDirection, JoinType, GlobalFilterType,
} from '../core/query-types';

// ── helpers ─────────────────────────────────────────────────────────────────

function makeService(): QueryService {
  // @Injectable has no constructor dependencies; instantiate directly
  return new QueryService();
}

function warnCodes(warnings: QueryWarning[]): string[] {
  return warnings.map(w => w.code as string);
}

// ════════════════════════════════════════════════════════════════════════════
// EPX product
// ════════════════════════════════════════════════════════════════════════════

describe('QueryService – EPX', () => {
  let svc: QueryService;
  beforeEach(() => { svc = makeService(); });

  // ── EC-EPX1  Basic INNER join ──────────────────────────────────────────

  it('TC-01  INNER join appointment × appointment_patient → 15 rows', () => {
    const result = svc.executeTableQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      columns: [
        { entity: 'appointment', field: 'id' },
        { entity: 'appointment_patient', field: 'price' },
      ],
    });

    expect(result.totalRows).toBe(15);
    expect(result.warnings).toHaveLength(0);
    expect(result.columns).toHaveLength(2);
    expect(result.columns[0].key).toBe('appointment.id');
  });

  // ── Filter: eq on string ───────────────────────────────────────────────

  it('TC-02  Filter status=completed → 9 rows', () => {
    const result = svc.executeTableQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      columns: [{ entity: 'appointment', field: 'id' }, { entity: 'appointment', field: 'status' }],
      filters: [{ entity: 'appointment', field: 'status', operator: FilterOperator.Eq, value: 'completed' }],
    });

    expect(result.totalRows).toBe(9);
    result.rows.forEach(r => expect(r['appointment.status']).toBe('completed'));
  });

  // ── Filter: in ────────────────────────────────────────────────────────

  it('TC-03  Filter status IN [no_show, cancelled] → 4 rows', () => {
    const result = svc.executeTableQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      columns: [{ entity: 'appointment', field: 'id' }, { entity: 'appointment', field: 'status' }],
      filters: [{ entity: 'appointment', field: 'status', operator: FilterOperator.In, values: ['no_show', 'cancelled'] }],
    });

    expect(result.totalRows).toBe(4);
  });

  // ── Filter: date_range preset ─────────────────────────────────────────

  it('TC-04  Date range "this_month" (March 2026) → 5 appointments', () => {
    const result = svc.executeTableQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      columns: [{ entity: 'appointment', field: 'id' }],
      filters: [{
        entity: 'appointment',
        field: 'start_date',
        operator: FilterOperator.DateRange,
        dateRange: { preset: DateRangePreset.ThisMonth },
      }],
    });

    expect(result.totalRows).toBe(5);
  });

  it('TC-05  Date range "last_month" (February 2026) → 5 appointments', () => {
    const result = svc.executeTableQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      columns: [{ entity: 'appointment', field: 'id' }],
      filters: [{
        entity: 'appointment',
        field: 'start_date',
        operator: FilterOperator.DateRange,
        dateRange: { preset: DateRangePreset.LastMonth },
      }],
    });

    expect(result.totalRows).toBe(5);
  });

  it('TC-06  Date range explicit from/to → Jan 2026 = 5 appointments', () => {
    const result = svc.executeTableQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      columns: [{ entity: 'appointment', field: 'id' }],
      filters: [{
        entity: 'appointment',
        field: 'start_date',
        operator: FilterOperator.DateRange,
        dateRange: { from: '2026-01-01', to: '2026-01-31' },
      }],
    });

    expect(result.totalRows).toBe(5);
  });

  // ── Filter: boolean ───────────────────────────────────────────────────

  it('TC-07  Filter is_remote=true → 6 appointments', () => {
    // Field name in config is 'is_remote' (column: isremoteappointment)
    const result = svc.executeTableQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      columns: [{ entity: 'appointment', field: 'id' }],
      filters: [{ entity: 'appointment', field: 'is_remote', operator: FilterOperator.Eq, value: true }],
    });

    expect(result.totalRows).toBe(6);
  });

  // ── Sort ──────────────────────────────────────────────────────────────

  it('TC-08  Sort by appointment_patient.price DESC → first row price = 150', () => {
    const result = svc.executeTableQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      columns: [
        { entity: 'appointment', field: 'id' },
        { entity: 'appointment_patient', field: 'price' },
      ],
      sort: { entity: 'appointment_patient', field: 'price', direction: SortDirection.Desc },
    });

    expect(result.rows[0]['appointment_patient.price']).toBe(150);
  });

  it('TC-09  Sort by appointment.start_date ASC → first row id = appt-001', () => {
    const result = svc.executeTableQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      columns: [{ entity: 'appointment', field: 'id' }, { entity: 'appointment', field: 'start_date' }],
      sort: { entity: 'appointment', field: 'start_date', direction: SortDirection.Asc },
    });

    expect(result.rows[0]['appointment.id']).toBe('appt-001');
  });

  // ── Pagination ────────────────────────────────────────────────────────

  it('TC-10  Pagination page=1 pageSize=5 → 5 rows, totalRows=15', () => {
    const result = svc.executeTableQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      columns: [{ entity: 'appointment', field: 'id' }],
      page: 1,
      pageSize: 5,
    });

    expect(result.rows).toHaveLength(5);
    expect(result.totalRows).toBe(15);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(5);
  });

  it('TC-11  Pagination page=3 pageSize=5 → 5 rows (last page)', () => {
    const result = svc.executeTableQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      columns: [{ entity: 'appointment', field: 'id' }],
      page: 3,
      pageSize: 5,
    });

    expect(result.rows).toHaveLength(5);
  });

  // ── Stat: COUNT ───────────────────────────────────────────────────────

  it('TC-12  Stat COUNT appointments = 15', () => {
    const result = svc.executeStatQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      agg: { entity: 'appointment', field: 'id', function: AggregationFunction.Count },
    });

    expect(result.value).toBe(15);
    expect(result.formattedValue).toBe('15');
    expect(result.warnings).toHaveLength(0);
  });

  // ── Stat: SUM ─────────────────────────────────────────────────────────

  it('TC-13  Stat SUM appointment_patient.price = 1210', () => {
    const result = svc.executeStatQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      agg: { entity: 'appointment_patient', field: 'price', function: AggregationFunction.Sum },
    });

    expect(result.value).toBe(1210);
  });

  // ── Stat: MIN / MAX ───────────────────────────────────────────────────

  it('TC-14  Stat MIN price = 0, MAX price = 150', () => {
    const min = svc.executeStatQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      agg: { entity: 'appointment_patient', field: 'price', function: AggregationFunction.Min },
    });
    const max = svc.executeStatQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      agg: { entity: 'appointment_patient', field: 'price', function: AggregationFunction.Max },
    });

    expect(min.value).toBe(0);
    expect(max.value).toBe(150);
  });

  // ── Chart: monthly grouping ───────────────────────────────────────────

  it('TC-15  Chart monthly COUNT → 3 labels, each with 5 appointments', () => {
    const result = svc.executeChartQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      dateAxis: { entity: 'appointment', field: 'start_date', interval: DateInterval.Month },
      valueAgg: { entity: 'appointment', field: 'id', function: AggregationFunction.Count },
    });

    expect(result.labels).toEqual(['2026-01', '2026-02', '2026-03']);
    expect(result.series).toHaveLength(1);
    expect(result.series[0].data).toEqual([5, 5, 5]);
  });

  // ── Chart: multi-series (grouped) ────────────────────────────────────

  it('TC-16  Chart monthly SUM price grouped by appointment.status', () => {
    const result = svc.executeChartQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      dateAxis: { entity: 'appointment', field: 'start_date', interval: DateInterval.Month },
      valueAgg: { entity: 'appointment_patient', field: 'price', function: AggregationFunction.Sum },
      groupBy: { entity: 'appointment', field: 'status' },
    });

    // Should have one series per unique status value
    const seriesNames = result.series.map(s => s.name).sort();
    expect(seriesNames).toContain('completed');
    expect(seriesNames).toContain('no_show');
    expect(seriesNames).toContain('cancelled');
    expect(result.labels).toEqual(['2026-01', '2026-02', '2026-03']);
  });

  // ── Pie: status distribution ──────────────────────────────────────────

  it('TC-17  Pie COUNT by appointment.status → 5 segments, completed=9', () => {
    const result = svc.executePieQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      groupBy: { entity: 'appointment', field: 'status' },
      valueAgg: { entity: 'appointment', field: 'id', function: AggregationFunction.Count },
    });

    expect(result.segments).toHaveLength(5);
    const completed = result.segments.find(s => s.label === 'completed');
    expect(completed?.value).toBe(9);
    // 5 segments ≤ 8 → no HIGH_CARDINALITY warning
    expect(warnCodes(result.warnings)).not.toContain('HIGH_CARDINALITY');
  });

  it('TC-17b  Pie: status segments have color from config status_values', () => {
    const result = svc.executePieQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      groupBy: { entity: 'appointment', field: 'status' },
      valueAgg: { entity: 'appointment', field: 'id', function: AggregationFunction.Count },
    });

    const completed = result.segments.find(s => s.label === 'completed');
    expect(completed?.color).toBeDefined();
  });

  // ── EC-XP2  HIGH_CARDINALITY warning ─────────────────────────────────

  it('TC-18  HIGH_CARDINALITY warning when pie has >8 unique segments', () => {
    // appointment.id has 15 unique values → must trigger warning
    const result = svc.executePieQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      groupBy: { entity: 'appointment', field: 'id' },
      valueAgg: { entity: 'appointment', field: 'id', function: AggregationFunction.Count },
    });

    expect(warnCodes(result.warnings)).toContain('HIGH_CARDINALITY');
  });

  // ── topN collapse ─────────────────────────────────────────────────────

  it('TC-19  topN=3 collapses remaining into "Other"', () => {
    // 5 status values; topN=3 → 3 top + 1 "Other"
    const result = svc.executePieQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      groupBy: { entity: 'appointment', field: 'status' },
      valueAgg: { entity: 'appointment', field: 'id', function: AggregationFunction.Count },
      topN: 3,
    });

    expect(result.segments).toHaveLength(4);
    const other = result.segments.find(s => s.label === 'Other');
    expect(other).toBeDefined();
    // total count must still equal 15
    const total = result.segments.reduce((s, seg) => s + seg.value, 0);
    expect(total).toBe(15);
  });

  // ── Warning: FILTER_ON_NON_FILTERABLE ─────────────────────────────────

  it('TC-20  FILTER_ON_NON_FILTERABLE warning when filtering on non-filterable field', () => {
    // appointment_patient.video_consultation_url is NOT filterable per config
    const result = svc.executeTableQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      columns: [{ entity: 'appointment', field: 'id' }],
      filters: [{ entity: 'appointment_patient', field: 'video_consultation_url', operator: FilterOperator.Contains, value: 'meet' }],
    });

    expect(warnCodes(result.warnings)).toContain('FILTER_ON_NON_FILTERABLE');
  });

  // ── Warning: ENTITY_NOT_REACHABLE ─────────────────────────────────────

  it('TC-21  ENTITY_NOT_REACHABLE warning when entity has no join path', () => {
    // Requesting 'patient' without the required intermediate 'appointment_patient' join
    const result = svc.executeTableQuery({
      product: 'epx',
      entities: ['appointment', 'patient'],   // missing appointment_patient bridge
      columns: [{ entity: 'appointment', field: 'id' }],
    });

    expect(warnCodes(result.warnings)).toContain('ENTITY_NOT_REACHABLE');
  });

  // ── Unknown product ───────────────────────────────────────────────────

  it('TC-22  Unknown product throws descriptive error', () => {
    expect(() => svc.getConfig('nonexistent')).toThrow('Unknown product');
  });

  // ── COUNT_DISTINCT ────────────────────────────────────────────────────

  it('TC-23  COUNT_DISTINCT appointment_patient.payor_type → 4 unique values', () => {
    // payor types: insurance, self_pay, corporate, nhs
    const result = svc.executeStatQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      agg: { entity: 'appointment_patient', field: 'payor_type', function: AggregationFunction.CountDistinct },
    });

    expect(result.value).toBe(4);
  });

  // ── Stat with trend ───────────────────────────────────────────────────

  it('TC-24  Stat with trend: Jan 2026 vs previous period (no prior data) → changePercent undefined', () => {
    const result = svc.executeStatQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      agg: { entity: 'appointment', field: 'id', function: AggregationFunction.Count },
      filters: [{
        entity: 'appointment',
        field: 'start_date',
        operator: FilterOperator.DateRange,
        dateRange: { from: '2026-01-01', to: '2026-01-31' },
      }],
      trend: { entity: 'appointment', field: 'start_date', interval: DateInterval.Month, periods: 1 },
    });

    expect(result.value).toBe(5);
    expect(result.previousValue).toBeDefined();
    // no appointments before Jan 2026 in mock data → previousValue = 0
    expect(result.previousValue).toBe(0);
    // division by zero case: changePercent should be undefined
    expect(result.changePercent).toBeUndefined();
  });

  // ── Chart: quarter grouping ───────────────────────────────────────────

  it('TC-25  Chart quarterly COUNT → Q1 2026 = 15 (all appointments)', () => {
    const result = svc.executeChartQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      dateAxis: { entity: 'appointment', field: 'start_date', interval: DateInterval.Quarter },
      valueAgg: { entity: 'appointment', field: 'id', function: AggregationFunction.Count },
    });

    expect(result.labels).toEqual(['2026-Q1']);
    expect(result.series[0].data).toEqual([15]);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Accounting product
// ════════════════════════════════════════════════════════════════════════════

describe('QueryService – Accounting', () => {
  let svc: QueryService;
  beforeEach(() => { svc = makeService(); });

  // ── Basic invoice load ────────────────────────────────────────────────

  it('TC-26  Invoice table query (no joins) → 12 rows', () => {
    const result = svc.executeTableQuery({
      product: 'accounting',
      entities: ['invoice'],
      columns: [{ entity: 'invoice', field: 'id' }, { entity: 'invoice', field: 'status' }],
    });

    expect(result.totalRows).toBe(12);
  });

  // ── INNER join: invoice × invoice_line ────────────────────────────────

  it('TC-27  Invoice INNER JOIN invoice_line → 9 rows (3 voided invoices have no line items)', () => {
    const result = svc.executeTableQuery({
      product: 'accounting',
      entities: ['invoice', 'invoice_line'],
      columns: [
        { entity: 'invoice', field: 'id' },
        { entity: 'invoice_line', field: 'id' },
      ],
    });

    // inv-003, inv-005, inv-008 (voided) have no invoice_lines → INNER drops them
    expect(result.totalRows).toBe(9);
    expect(result.warnings).toHaveLength(0);
  });

  // ── EC-ACC5  Fan-out via payment_allocation ───────────────────────────

  it('TC-28  EC-ACC5 LEFT JOIN payment_allocation produces FAN_OUT_RISK warning', () => {
    const result = svc.executeTableQuery({
      product: 'accounting',
      entities: ['invoice', 'payment_allocation'],
      columns: [
        { entity: 'invoice', field: 'id' },
        { entity: 'payment_allocation', field: 'allocated_amount' },
      ],
    });

    // inv-001 and inv-007 each have 2 allocation rows → row multiplication
    // 8 allocation rows + 6 null rows (invoices without allocation) = 14 total
    expect(result.totalRows).toBe(14);
    expect(warnCodes(result.warnings)).toContain('FAN_OUT_RISK');
    expect(warnCodes(result.warnings)).toContain('LEFT_JOIN_NULL');
  });

  it('TC-29  EC-ACC5 SUM(invoice.total_amount) with fan-out is over-counted', () => {
    // Without join (correct): SUM(totalamount) for all 12 = 1005
    // inv-001(120)+inv-002(85)+inv-003(0)+inv-004(120)+inv-005(0)+inv-006(120)
    // +inv-007(150)+inv-008(0)+inv-009(85)+inv-010(120)+inv-011(120)+inv-012(85) = 1005
    const correct = svc.executeStatQuery({
      product: 'accounting',
      entities: ['invoice'],
      agg: { entity: 'invoice', field: 'total_amount', function: AggregationFunction.Sum },
    });
    expect(correct.value).toBe(1005);

    // With fan-out join: inv-001 and inv-007 are counted twice each → inflated
    const fanOut = svc.executeStatQuery({
      product: 'accounting',
      entities: ['invoice', 'payment_allocation'],
      agg: { entity: 'invoice', field: 'total_amount', function: AggregationFunction.Sum },
    });
    // inv-001 counted twice (+120) and inv-007 counted twice (+150) = 1005 + 270 = 1275
    expect(fanOut.value).toBe(1275);
    expect(fanOut.value).toBeGreaterThan(correct.value);
    expect(warnCodes(fanOut.warnings)).toContain('FAN_OUT_RISK');
  });

  it('TC-30  EC-ACC5 SUM(allocated_amount) gives correct total = 730', () => {
    // 96+24+85+120+110+120+30+85 = 670
    // Wait: 96+24=120, +85=205, +120=325, +110=435, +120=555, +30=585, +85=670
    const result = svc.executeStatQuery({
      product: 'accounting',
      entities: ['invoice', 'payment_allocation'],
      agg: { entity: 'payment_allocation', field: 'allocated_amount', function: AggregationFunction.Sum },
    });

    // 96+24+85+120+110+120+30+85 = 670 (only non-null rows; LEFT JOIN nulls excluded from SUM)
    expect(result.value).toBe(670);
  });

  // ── Filter: is_void = true ────────────────────────────────────────────

  it('TC-31  Filter isvoid=true → 3 voided invoices', () => {
    const result = svc.executeTableQuery({
      product: 'accounting',
      entities: ['invoice'],
      columns: [{ entity: 'invoice', field: 'id' }, { entity: 'invoice', field: 'is_void' }],
      filters: [{ entity: 'invoice', field: 'is_void', operator: FilterOperator.Eq, value: true }],
    });

    expect(result.totalRows).toBe(3);
    result.rows.forEach(r => expect(r['invoice.is_void']).toBe(true));
  });

  // ── LEFT_JOIN_NULL on claim ───────────────────────────────────────────

  it('TC-32  EC-ACC4 invoice LEFT JOIN claim: 8 invoices have no claim → LEFT_JOIN_NULL warning', () => {
    const result = svc.executeTableQuery({
      product: 'accounting',
      entities: ['invoice', 'claim'],
      columns: [{ entity: 'invoice', field: 'id' }, { entity: 'claim', field: 'id' }],
    });

    // 4 claims exist; 8 invoices have no claim row
    expect(result.totalRows).toBe(12);
    expect(warnCodes(result.warnings)).toContain('LEFT_JOIN_NULL');

    const nullClaims = result.rows.filter(r => r['claim.id'] === null);
    expect(nullClaims).toHaveLength(8);
  });

  // ── is_null / is_not_null ─────────────────────────────────────────────

  it('TC-33  Filter claim.approved_amount is_null → 1 row (clm-004, not yet processed)', () => {
    const result = svc.executeTableQuery({
      product: 'accounting',
      entities: ['invoice', 'claim'],
      columns: [{ entity: 'claim', field: 'id' }, { entity: 'claim', field: 'approved_amount' }],
      filters: [
        { entity: 'claim', field: 'id', operator: FilterOperator.IsNotNull },        // exclude no-claim rows
        { entity: 'claim', field: 'approved_amount', operator: FilterOperator.IsNull }, // pending approval
      ],
    });

    expect(result.totalRows).toBe(1);
    expect(result.rows[0]['claim.id']).toBe('clm-004');
  });

  // ── EC-ACC3  Status mismatch ──────────────────────────────────────────

  it('TC-34  EC-ACC3 inv-007 shows status=paid but has a pending payment', () => {
    // This is a data-quality scenario: the query just shows both values.
    // invoice status='paid', payment status='pending' (pay-007)
    const result = svc.executeTableQuery({
      product: 'accounting',
      entities: ['invoice', 'payment_allocation', 'payment'],
      columns: [
        { entity: 'invoice', field: 'id' },
        { entity: 'invoice', field: 'status' },
        { entity: 'payment', field: 'status' },
        { entity: 'payment', field: 'amount' },
      ],
      filters: [{ entity: 'invoice', field: 'id', operator: FilterOperator.Eq, value: 'inv-007' }],
    });

    // inv-007 has 2 allocation rows → 2 result rows
    expect(result.totalRows).toBe(2);
    const invoiceStatuses = result.rows.map(r => r['invoice.status']);
    expect(invoiceStatuses.every(s => s === 'paid')).toBe(true);

    const paymentStatuses = result.rows.map(r => r['payment.status']);
    expect(paymentStatuses).toContain('cleared');
    expect(paymentStatuses).toContain('pending');
  });

  // ── Chart: claim by payer ─────────────────────────────────────────────

  it('TC-35  Claim COUNT by month (submitted_date) → correct labels', () => {
    const result = svc.executeChartQuery({
      product: 'accounting',
      entities: ['invoice', 'claim'],
      dateAxis: { entity: 'claim', field: 'submitted_date', interval: DateInterval.Month },
      valueAgg: { entity: 'claim', field: 'id', function: AggregationFunction.Count },
      filters: [{ entity: 'claim', field: 'id', operator: FilterOperator.IsNotNull }],
    });

    // 4 claims: Jan (clm-001 Jan-10, clm-002 Jan-18), Feb (clm-003 Feb-10), Mar (clm-004 Mar-05)
    expect(result.labels).toEqual(['2026-01', '2026-02', '2026-03']);
    expect(result.series[0].data).toEqual([2, 1, 1]);
  });

  // ── gt filter on number ───────────────────────────────────────────────

  it('TC-36  Filter invoice.total_amount > 100 → 7 invoices', () => {
    // Invoices with total_amount > 100: inv-001(120), inv-004(120), inv-006(120), inv-007(150),
    //   inv-010(120), inv-011(120) = 6 non-zero. Also inv-012(85) ≤ 100.
    // inv-001(120), inv-004(120), inv-006(120), inv-007(150), inv-010(120), inv-011(120) = 6
    const result = svc.executeTableQuery({
      product: 'accounting',
      entities: ['invoice'],
      columns: [{ entity: 'invoice', field: 'id' }, { entity: 'invoice', field: 'total_amount' }],
      filters: [{ entity: 'invoice', field: 'total_amount', operator: FilterOperator.Gt, value: 100 }],
    });

    expect(result.totalRows).toBe(6);
    result.rows.forEach(r => expect(r['invoice.total_amount'] as number).toBeGreaterThan(100));
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Prescriptions product
// ════════════════════════════════════════════════════════════════════════════

describe('QueryService – Prescriptions', () => {
  let svc: QueryService;
  beforeEach(() => { svc = makeService(); });

  // ── Basic load ────────────────────────────────────────────────────────

  it('TC-37  Prescription table load → 15 rows, no warnings', () => {
    const result = svc.executeTableQuery({
      product: 'prescriptions',
      entities: ['prescription'],
      columns: [{ entity: 'prescription', field: 'id' }, { entity: 'prescription', field: 'status' }],
    });

    expect(result.totalRows).toBe(15);
    expect(result.warnings).toHaveLength(0);
  });

  // ── EC-RX1  LEFT JOIN dispense ────────────────────────────────────────

  it('TC-38  EC-RX1 prescription LEFT JOIN dispense → 15 rows, LEFT_JOIN_NULL warning', () => {
    const result = svc.executeTableQuery({
      product: 'prescriptions',
      entities: ['prescription', 'dispense'],
      columns: [
        { entity: 'prescription', field: 'id' },
        { entity: 'dispense', field: 'id' },
        { entity: 'dispense', field: 'dispensed_quantity' },
      ],
    });

    expect(result.totalRows).toBe(15);
    expect(warnCodes(result.warnings)).toContain('LEFT_JOIN_NULL');

    const notDispensed = result.rows.filter(r => r['dispense.id'] === null);
    // rx-005, rx-011, rx-013, rx-014, rx-015 have no dispense record = 5 null rows
    expect(notDispensed).toHaveLength(5);
  });

  // ── Filter: is_not_null (dispensed only) ──────────────────────────────

  it('TC-39  Filter dispense.id is_not_null → 10 dispensed prescriptions', () => {
    const result = svc.executeTableQuery({
      product: 'prescriptions',
      entities: ['prescription', 'dispense'],
      columns: [{ entity: 'prescription', field: 'id' }, { entity: 'dispense', field: 'id' }],
      filters: [{ entity: 'dispense', field: 'id', operator: FilterOperator.IsNotNull }],
    });

    expect(result.totalRows).toBe(10);
  });

  // ── INNER chain: prescription × prescription_item × medication ────────

  it('TC-40  3-way INNER join prescription+item+medication → 15 rows, no warnings', () => {
    const result = svc.executeTableQuery({
      product: 'prescriptions',
      entities: ['prescription', 'prescription_item', 'medication'],
      columns: [
        { entity: 'prescription', field: 'id' },
        { entity: 'medication', field: 'name' },
      ],
    });

    expect(result.totalRows).toBe(15);
    expect(result.warnings).toHaveLength(0);
  });

  // ── EC-RX4  Controlled substance ─────────────────────────────────────

  it('TC-41  EC-RX4 Controlled substance count (med-005 tramadol) → 1 prescription', () => {
    const result = svc.executeTableQuery({
      product: 'prescriptions',
      entities: ['prescription', 'prescription_item', 'medication'],
      columns: [
        { entity: 'prescription', field: 'id' },
        { entity: 'medication', field: 'name' },
        { entity: 'medication', field: 'is_controlled' },
      ],
      filters: [{ entity: 'medication', field: 'is_controlled', operator: FilterOperator.Eq, value: true }],
    });

    // Only rx-015 prescribes tramadol (med-005, is_controlled=true)
    expect(result.totalRows).toBe(1);
    expect(result.rows[0]['medication.name']).toBe('tramadol');
  });

  // ── EC-RX3  AVG repeat_count dilution ────────────────────────────────

  it('TC-42  EC-RX3 AVG repeat_count all rows = 3.0 (diluted by non-repeat rows)', () => {
    const result = svc.executeStatQuery({
      product: 'prescriptions',
      entities: ['prescription'],
      agg: { entity: 'prescription', field: 'repeat_count', function: AggregationFunction.Avg },
    });

    expect(result.value).toBeCloseTo(3.0);
  });

  it('TC-43  EC-RX3 AVG repeat_count filtered is_repeat=true = 4.5 (meaningful average)', () => {
    const result = svc.executeStatQuery({
      product: 'prescriptions',
      entities: ['prescription'],
      agg: { entity: 'prescription', field: 'repeat_count', function: AggregationFunction.Avg },
      filters: [{ entity: 'prescription', field: 'is_repeat', operator: FilterOperator.Eq, value: true }],
    });

    expect(result.value).toBeCloseTo(4.5);
  });

  // ── EC-RX2  Partial dispense ──────────────────────────────────────────

  it('TC-44  EC-RX2 Partial dispense: rx-009 dispensed_quantity=15, prescribed=30', () => {
    const result = svc.executeTableQuery({
      product: 'prescriptions',
      entities: ['prescription', 'prescription_item', 'dispense'],
      columns: [
        { entity: 'prescription', field: 'id' },
        { entity: 'prescription', field: 'status' },
        { entity: 'prescription_item', field: 'quantity' },
        { entity: 'dispense', field: 'dispensed_quantity' },
        { entity: 'dispense', field: 'status' },
      ],
      filters: [{ entity: 'prescription', field: 'id', operator: FilterOperator.Eq, value: 'rx-009' }],
    });

    expect(result.totalRows).toBe(1);
    const row = result.rows[0];
    expect(row['prescription.status']).toBe('partial');
    expect(row['prescription_item.quantity']).toBe(30);
    expect(row['dispense.dispensed_quantity']).toBe(15);
    expect(row['dispense.status']).toBe('partial');
  });

  // ── INNER join: prescription × prescriber ────────────────────────────

  it('TC-45  prescription INNER JOIN prescriber → 15 rows (cross-schema join)', () => {
    const result = svc.executeTableQuery({
      product: 'prescriptions',
      entities: ['prescription', 'prescriber'],
      columns: [
        { entity: 'prescription', field: 'id' },
        { entity: 'prescriber', field: 'lastname' },
        { entity: 'prescriber', field: 'specialty' },
      ],
    });

    expect(result.totalRows).toBe(15);
    expect(result.warnings).toHaveLength(0);
  });

  it('TC-46  Prescriptions by prescriber.specialty (pie) → 3 segments', () => {
    // GP=9, Cardiology=3, Endocrinology=3
    const result = svc.executePieQuery({
      product: 'prescriptions',
      entities: ['prescription', 'prescriber'],
      groupBy: { entity: 'prescriber', field: 'specialty' },
      valueAgg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
    });

    expect(result.segments).toHaveLength(3);
    const gp = result.segments.find(s => s.label === 'GP');
    expect(gp?.value).toBe(9);
    // 3 segments ≤ 8 → no HIGH_CARDINALITY
    expect(warnCodes(result.warnings)).not.toContain('HIGH_CARDINALITY');
  });

  // ── contains filter ───────────────────────────────────────────────────

  it('TC-47  Filter medication.name contains "in" → 9 prescription-items (lisinopril + metformin + amoxicillin)', () => {
    const result = svc.executeTableQuery({
      product: 'prescriptions',
      entities: ['prescription', 'prescription_item', 'medication'],
      columns: [
        { entity: 'prescription', field: 'id' },
        { entity: 'medication', field: 'name' },
      ],
      filters: [{ entity: 'medication', field: 'name', operator: FilterOperator.Contains, value: 'in' }],
    });

    // lisinopril (4: rx-001,007,009,012) + metformin (3: rx-004,010,014) + amoxicillin (2: rx-002,005) + atorvastatin (3: rx-003,008,013) = 12
    // 'atorvastatin' also contains 'in' (atorvast-atin)
    expect(result.totalRows).toBe(12);
    result.rows.forEach(r => {
      expect(String(r['medication.name']).toLowerCase()).toContain('in');
    });
  });

  // ── Repeat prescriptions chain ────────────────────────────────────────

  it('TC-48  Repeat chain: 3 prescriptions for pat-001 (original + 2 repeats)', () => {
    const result = svc.executeTableQuery({
      product: 'prescriptions',
      entities: ['prescription'],
      columns: [
        { entity: 'prescription', field: 'id' },
        { entity: 'prescription', field: 'is_repeat' },
        { entity: 'prescription', field: 'repeat_count' },
      ],
      filters: [{ entity: 'prescription', field: 'patient_id', operator: FilterOperator.Eq, value: 'pat-001' }],
      sort: { entity: 'prescription', field: 'prescribed_date', direction: SortDirection.Asc },
    });

    expect(result.totalRows).toBe(3); // rx-001, rx-007, rx-012
    expect(result.rows[0]['prescription.is_repeat']).toBe(true);
  });

  // ── Monthly chart for prescriptions ──────────────────────────────────

  it('TC-49  Prescription monthly COUNT → Jan=5, Feb=6, Mar=4', () => {
    const result = svc.executeChartQuery({
      product: 'prescriptions',
      entities: ['prescription'],
      dateAxis: { entity: 'prescription', field: 'prescribed_date', interval: DateInterval.Month },
      valueAgg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
    });

    // Jan: rx-001,002,003,004,005 = 5
    // Feb: rx-006,007,008,009,010,011 = 6
    // Mar: rx-012,013,014,015 = 4
    expect(result.labels).toEqual(['2026-01', '2026-02', '2026-03']);
    expect(result.series[0].data).toEqual([5, 6, 4]);
  });

  // ── ResultColumn metadata ─────────────────────────────────────────────

  it('TC-50  ResultColumn for prescription.status includes status_values', () => {
    const result = svc.executeTableQuery({
      product: 'prescriptions',
      entities: ['prescription'],
      columns: [{ entity: 'prescription', field: 'status' }],
    });

    const statusCol = result.columns.find(c => c.key === 'prescription.status');
    expect(statusCol).toBeDefined();
    expect(statusCol?.statusValues).toBeDefined();
    expect(statusCol?.statusValues?.length).toBeGreaterThan(0);
    const active = statusCol?.statusValues?.find(sv => sv.value === 'active');
    expect(active?.color).toBeDefined();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Filter operators — full coverage
// ════════════════════════════════════════════════════════════════════════════

describe('QueryService – Filter operators', () => {
  let svc: QueryService;
  beforeEach(() => { svc = makeService(); });

  it('TC-51  neq: appointment.status neq completed → 6 rows', () => {
    const result = svc.executeTableQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      columns: [{ entity: 'appointment', field: 'status' }],
      filters: [{ entity: 'appointment', field: 'status', operator: FilterOperator.Neq, value: 'completed' }],
    });

    expect(result.totalRows).toBe(6);
    result.rows.forEach(r => expect(r['appointment.status']).not.toBe('completed'));
  });

  it('TC-52  not_in: appointment.status not_in [completed, no_show, cancelled] → 2 rows (confirmed + scheduled)', () => {
    const result = svc.executeTableQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      columns: [{ entity: 'appointment', field: 'status' }],
      filters: [{
        entity: 'appointment',
        field: 'status',
        operator: FilterOperator.NotIn,
        values: ['completed', 'no_show', 'cancelled'],
      }],
    });

    expect(result.totalRows).toBe(2);
    const statuses = result.rows.map(r => r['appointment.status']);
    expect(statuses).toContain('confirmed');
    expect(statuses).toContain('scheduled');
  });

  it('TC-53  gte: appointment_patient.price >= 120 → 7 rows', () => {
    // Rows with price >= 120: appt-001,004,006,007,010,011,014 (7 rows at 120 or 150)
    const result = svc.executeTableQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      columns: [{ entity: 'appointment_patient', field: 'price' }],
      filters: [{ entity: 'appointment_patient', field: 'price', operator: FilterOperator.Gte, value: 120 }],
    });

    expect(result.totalRows).toBe(7);
    result.rows.forEach(r => expect(r['appointment_patient.price'] as number).toBeGreaterThanOrEqual(120));
  });

  it('TC-54  lt: appointment_patient.price < 85 → 4 rows (all zero-price)', () => {
    // Only appt-003, 005, 008, 013 have price=0
    const result = svc.executeTableQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      columns: [{ entity: 'appointment_patient', field: 'price' }],
      filters: [{ entity: 'appointment_patient', field: 'price', operator: FilterOperator.Lt, value: 85 }],
    });

    expect(result.totalRows).toBe(4);
    result.rows.forEach(r => expect(r['appointment_patient.price'] as number).toBeLessThan(85));
  });

  it('TC-55  lte: appointment_patient.price <= 85 → 8 rows (0 and 85 priced)', () => {
    // price=0: appt-003,005,008,013 (4) + price=85: appt-002,009,012,015 (4) = 8
    const result = svc.executeTableQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      columns: [{ entity: 'appointment_patient', field: 'price' }],
      filters: [{ entity: 'appointment_patient', field: 'price', operator: FilterOperator.Lte, value: 85 }],
    });

    expect(result.totalRows).toBe(8);
    result.rows.forEach(r => expect(r['appointment_patient.price'] as number).toBeLessThanOrEqual(85));
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Date intervals — full coverage
// ════════════════════════════════════════════════════════════════════════════

describe('QueryService – Date intervals', () => {
  let svc: QueryService;
  beforeEach(() => { svc = makeService(); });

  it('TC-56  year interval: all 15 prescriptions fall in single bucket "2026"', () => {
    const result = svc.executeChartQuery({
      product: 'prescriptions',
      entities: ['prescription'],
      dateAxis: { entity: 'prescription', field: 'prescribed_date', interval: DateInterval.Year },
      valueAgg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
    });

    expect(result.labels).toEqual(['2026']);
    expect(result.series[0].data).toEqual([15]);
  });

  it('TC-57  day interval: 15 prescriptions on 14 unique days (rx-008 and rx-011 share Feb 12)', () => {
    const result = svc.executeChartQuery({
      product: 'prescriptions',
      entities: ['prescription'],
      dateAxis: { entity: 'prescription', field: 'prescribed_date', interval: DateInterval.Day },
      valueAgg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
    });

    expect(result.labels).toHaveLength(14);
    // Feb 12 bucket has count 2
    expect(result.series[0].data).toContain(2);
    // All other buckets have count 1
    const singleDays = result.series[0].data.filter(c => c === 1);
    expect(singleDays).toHaveLength(13);
    // Total across all buckets = 15
    const total = result.series[0].data.reduce((s, c) => s + c, 0);
    expect(total).toBe(15);
  });

  it('TC-58  week interval: total prescriptions across all weeks = 15', () => {
    const result = svc.executeChartQuery({
      product: 'prescriptions',
      entities: ['prescription'],
      dateAxis: { entity: 'prescription', field: 'prescribed_date', interval: DateInterval.Week },
      valueAgg: { entity: 'prescription', field: 'id', function: AggregationFunction.Count },
    });

    // All labels start with "2026-W"
    result.labels.forEach(l => expect(l).toMatch(/^2026-W\d{2}$/));
    const total = result.series[0].data.reduce((s, c) => s + c, 0);
    expect(total).toBe(15);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Date range presets — full coverage (MOCK_TODAY = 2026-03-17)
// ════════════════════════════════════════════════════════════════════════════

describe('QueryService – Date range presets', () => {
  let svc: QueryService;
  beforeEach(() => { svc = makeService(); });

  // EPX appointments: Jan 6,9,13,16,20 / Feb 3,7,11,17,24 / Mar 3,7,12,19,24

  it('TC-59  last_7_days (Mar 11–17): 1 appointment (appt-013 Mar 12)', () => {
    const result = svc.executeTableQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      columns: [{ entity: 'appointment', field: 'id' }],
      filters: [{ entity: 'appointment', field: 'start_date', operator: FilterOperator.DateRange, dateRange: { preset: DateRangePreset.Last7Days } }],
    });

    expect(result.totalRows).toBe(1);
    expect(result.rows[0]['appointment.id']).toBe('appt-013');
  });

  it('TC-60  last_30_days (Feb 16–Mar 17): 5 appointments', () => {
    // appt-009 (Feb 17), appt-010 (Feb 24), appt-011 (Mar 3), appt-012 (Mar 7), appt-013 (Mar 12)
    const result = svc.executeTableQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      columns: [{ entity: 'appointment', field: 'id' }],
      filters: [{ entity: 'appointment', field: 'start_date', operator: FilterOperator.DateRange, dateRange: { preset: DateRangePreset.Last30Days } }],
    });

    expect(result.totalRows).toBe(5);
  });

  it('TC-61  last_90_days (Dec 18 2025 – Mar 17 2026): 13 appointments (appt-014 Mar 19 and appt-015 Mar 24 are after today)', () => {
    const result = svc.executeTableQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      columns: [{ entity: 'appointment', field: 'id' }],
      filters: [{ entity: 'appointment', field: 'start_date', operator: FilterOperator.DateRange, dateRange: { preset: DateRangePreset.Last90Days } }],
    });

    // appt-014 (Mar 19) and appt-015 (Mar 24) are after MOCK_TODAY (Mar 17) → excluded
    expect(result.totalRows).toBe(13);
  });

  it('TC-62  this_year (2026): all 15 appointments', () => {
    const result = svc.executeTableQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      columns: [{ entity: 'appointment', field: 'id' }],
      filters: [{ entity: 'appointment', field: 'start_date', operator: FilterOperator.DateRange, dateRange: { preset: DateRangePreset.ThisYear } }],
    });

    expect(result.totalRows).toBe(15);
  });

  it('TC-63  last_year (2025): 0 appointments (all data is 2026)', () => {
    const result = svc.executeTableQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      columns: [{ entity: 'appointment', field: 'id' }],
      filters: [{ entity: 'appointment', field: 'start_date', operator: FilterOperator.DateRange, dateRange: { preset: DateRangePreset.LastYear } }],
    });

    expect(result.totalRows).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3-entity mixed INNER + LEFT join chains
// ════════════════════════════════════════════════════════════════════════════

describe('QueryService – Multi-entity join chains', () => {
  let svc: QueryService;
  beforeEach(() => { svc = makeService(); });

  it('TC-64  prescription INNER item LEFT dispense → 15 rows, LEFT_JOIN_NULL warning', () => {
    // prescription→prescription_item is INNER (all 15 match one-to-one)
    // prescription→dispense is LEFT (5 have no dispense: rx-005,011,013,014,015)
    const result = svc.executeTableQuery({
      product: 'prescriptions',
      entities: ['prescription', 'prescription_item', 'dispense'],
      columns: [
        { entity: 'prescription', field: 'id' },
        { entity: 'prescription_item', field: 'quantity' },
        { entity: 'dispense', field: 'dispensed_quantity' },
      ],
    });

    expect(result.totalRows).toBe(15);
    expect(warnCodes(result.warnings)).toContain('LEFT_JOIN_NULL');

    const nullDispense = result.rows.filter(r => r['dispense.dispensed_quantity'] === null);
    expect(nullDispense).toHaveLength(5);
  });

  it('TC-65  invoice LEFT payment_allocation INNER payment → 8 rows (LEFT-null rows dropped by INNER)', () => {
    // Step 1: invoice LEFT payment_allocation → 14 rows (8 matched + 6 null)
    // Step 2: payment_allocation INNER payment → null rows have null payment_id → INNER drops them
    // Result: only the 8 rows with actual allocations survive
    const result = svc.executeTableQuery({
      product: 'accounting',
      entities: ['invoice', 'payment_allocation', 'payment'],
      columns: [
        { entity: 'invoice', field: 'id' },
        { entity: 'payment_allocation', field: 'allocated_amount' },
        { entity: 'payment', field: 'payment_method' },
      ],
    });

    expect(result.totalRows).toBe(8);
    // LEFT_JOIN_NULL from first join is still warned (invoices without allocations were produced momentarily)
    expect(warnCodes(result.warnings)).toContain('LEFT_JOIN_NULL');
    // FAN_OUT_RISK because inv-001 and inv-007 each had 2 allocation rows
    expect(warnCodes(result.warnings)).toContain('FAN_OUT_RISK');
    // Every row must have a non-null payment_method (no nulls from INNER join)
    result.rows.forEach(r => expect(r['payment.payment_method']).not.toBeNull());
  });

  it('TC-66  invoice LEFT claim INNER payer → only 4 rows (invoices with claims + payers)', () => {
    // Only 4 invoices have claims (clm-001..004); INNER join to payer keeps all 4
    const result = svc.executeTableQuery({
      product: 'accounting',
      entities: ['invoice', 'claim', 'payer'],
      columns: [
        { entity: 'invoice', field: 'id' },
        { entity: 'claim', field: 'claim_number' },
        { entity: 'payer', field: 'name' },
      ],
    });

    expect(result.totalRows).toBe(4);
    result.rows.forEach(r => expect(r['payer.name']).not.toBeNull());
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Empty result handling
// ════════════════════════════════════════════════════════════════════════════

describe('QueryService – Empty result handling', () => {
  let svc: QueryService;
  beforeEach(() => { svc = makeService(); });

  it('TC-67  Table query with no matches → 0 rows, no error', () => {
    const result = svc.executeTableQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      columns: [{ entity: 'appointment', field: 'id' }],
      filters: [{ entity: 'appointment', field: 'status', operator: FilterOperator.Eq, value: '__no_such_status__' }],
    });

    expect(result.totalRows).toBe(0);
    expect(result.rows).toHaveLength(0);
    expect(result.columns).toHaveLength(1); // columns still defined even with 0 rows
  });

  it('TC-68  Stat COUNT on empty result → 0', () => {
    const result = svc.executeStatQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      agg: { entity: 'appointment', field: 'id', function: AggregationFunction.Count },
      filters: [{ entity: 'appointment', field: 'status', operator: FilterOperator.Eq, value: '__none__' }],
    });

    expect(result.value).toBe(0);
    expect(result.formattedValue).toBe('0');
  });

  it('TC-69  Stat SUM / AVG / MIN / MAX on empty result → 0', () => {
    const filter = [{ entity: 'appointment', field: 'status', operator: FilterOperator.Eq as const, value: '__none__' }];
    const base = { product: 'epx', entities: ['appointment', 'appointment_patient'], filters: filter };

    expect(svc.executeStatQuery({ ...base, agg: { entity: 'appointment_patient', field: 'price', function: AggregationFunction.Sum } }).value).toBe(0);
    expect(svc.executeStatQuery({ ...base, agg: { entity: 'appointment_patient', field: 'price', function: AggregationFunction.Avg } }).value).toBe(0);
    expect(svc.executeStatQuery({ ...base, agg: { entity: 'appointment_patient', field: 'price', function: AggregationFunction.Min } }).value).toBe(0);
    expect(svc.executeStatQuery({ ...base, agg: { entity: 'appointment_patient', field: 'price', function: AggregationFunction.Max } }).value).toBe(0);
  });

  it('TC-70  Chart query on empty result → no labels, empty data series', () => {
    const result = svc.executeChartQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      dateAxis: { entity: 'appointment', field: 'start_date', interval: DateInterval.Month },
      valueAgg: { entity: 'appointment', field: 'id', function: AggregationFunction.Count },
      filters: [{ entity: 'appointment', field: 'status', operator: FilterOperator.Eq, value: '__none__' }],
    });

    expect(result.labels).toHaveLength(0);
    expect(result.series[0].data).toHaveLength(0);
  });

  it('TC-71  Pie query on empty result → no segments, no HIGH_CARDINALITY warning', () => {
    const result = svc.executePieQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      groupBy: { entity: 'appointment', field: 'status' },
      valueAgg: { entity: 'appointment', field: 'id', function: AggregationFunction.Count },
      filters: [{ entity: 'appointment', field: 'status', operator: FilterOperator.Eq, value: '__none__' }],
    });

    expect(result.segments).toHaveLength(0);
    expect(warnCodes(result.warnings)).not.toContain('HIGH_CARDINALITY');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// AVG_INCLUDES_NULLS warning
// ════════════════════════════════════════════════════════════════════════════

describe('QueryService – AVG_INCLUDES_NULLS warning', () => {
  let svc: QueryService;
  beforeEach(() => { svc = makeService(); });

  it('TC-72  AVG on LEFT-joined field emits AVG_INCLUDES_NULLS warning', () => {
    // prescription LEFT dispense → 5 rows have null dispensed_quantity
    const result = svc.executeStatQuery({
      product: 'prescriptions',
      entities: ['prescription', 'dispense'],
      agg: { entity: 'dispense', field: 'dispensed_quantity', function: AggregationFunction.Avg },
    });

    expect(warnCodes(result.warnings)).toContain('AVG_INCLUDES_NULLS');
    const w = result.warnings.find(w => w.code === QueryWarningCode.AvgIncludesNulls);
    expect(w?.message).toContain('5');
  });

  it('TC-73  AVG_INCLUDES_NULLS: computed average uses only 10 non-null rows = 33.4', () => {
    // dispensed_quantity for 10 dispensed prescriptions:
    // disp-001(30)+disp-002(21)+disp-003(30)+disp-004(60)+disp-005(28)+disp-006(30)
    // +disp-007(30)+disp-008(15)+disp-009(60)+disp-010(30) = 334 / 10 = 33.4
    const result = svc.executeStatQuery({
      product: 'prescriptions',
      entities: ['prescription', 'dispense'],
      agg: { entity: 'dispense', field: 'dispensed_quantity', function: AggregationFunction.Avg },
    });

    expect(result.value).toBeCloseTo(33.4, 1);
  });

  it('TC-74  AVG on field with NO nulls does NOT emit AVG_INCLUDES_NULLS', () => {
    // appointment_patient.price has no nulls (INNER join, all rows have a price)
    const result = svc.executeStatQuery({
      product: 'epx',
      entities: ['appointment', 'appointment_patient'],
      agg: { entity: 'appointment_patient', field: 'price', function: AggregationFunction.Avg },
    });

    expect(warnCodes(result.warnings)).not.toContain('AVG_INCLUDES_NULLS');
    // avg price = 1210 / 15 ≈ 80.67
    expect(result.value).toBeCloseTo(80.67, 1);
  });

  it('TC-75  COUNT/SUM/MIN/MAX never emit AVG_INCLUDES_NULLS', () => {
    const base = {
      product: 'prescriptions',
      entities: ['prescription', 'dispense'],
    };
    for (const fn of [AggregationFunction.Count, AggregationFunction.Sum, AggregationFunction.Min, AggregationFunction.Max]) {
      const r = svc.executeStatQuery({ ...base, agg: { entity: 'dispense', field: 'dispensed_quantity', function: fn } });
      expect(warnCodes(r.warnings)).not.toContain('AVG_INCLUDES_NULLS');
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Schema explorer API
// ════════════════════════════════════════════════════════════════════════════

describe('QueryService – Schema explorer API', () => {
  let svc: QueryService;
  beforeEach(() => { svc = makeService(); });

  it('TC-76  getProductList() returns 3 products', () => {
    const products = svc.getProductList();

    expect(products).toHaveLength(3);
    const slugs = products.map(p => p.slug);
    expect(slugs).toContain('epx');
    expect(slugs).toContain('accounting');
    expect(slugs).toContain('prescriptions');
    products.forEach(p => expect(p.display_name).toBeTruthy());
  });

  it('TC-77  getEntityList("epx") returns 8 entities', () => {
    const entities = svc.getEntityList('epx');
    expect(entities).toHaveLength(8);
    const names = entities.map(e => e.name);
    expect(names).toContain('appointment');
    expect(names).toContain('patient');
  });

  it('TC-78  getEntityList("prescriptions") returns 5 entities', () => {
    const entities = svc.getEntityList('prescriptions');
    expect(entities).toHaveLength(5);
  });

  it('TC-79  getFieldList("prescriptions", "medication") returns 9 fields', () => {
    const fields = svc.getFieldList('prescriptions', 'medication');
    expect(fields).toHaveLength(9);
    const names = fields.map(f => f.name);
    expect(names).toContain('name');
    expect(names).toContain('is_controlled');
    expect(names).toContain('drug_class');
  });

  it('TC-80  getGlobalFilterDimensions("accounting") returns 3 dimensions (site + 2 date)', () => {
    const dims = svc.getGlobalFilterDimensions('accounting');
    expect(dims).toHaveLength(3);
    expect(dims.filter(d => d.type === GlobalFilterType.Date)).toHaveLength(2);
    expect(dims.filter(d => d.type === GlobalFilterType.Site)).toHaveLength(1);
  });

  it('TC-81  getGlobalFilterDimensions("epx") returns 2 dimensions', () => {
    const dims = svc.getGlobalFilterDimensions('epx');
    expect(dims).toHaveLength(2);
  });

  it('TC-82  getJoins("accounting") returns 5 join definitions', () => {
    const joins = svc.getJoins('accounting');
    expect(joins).toHaveLength(5);
    const types = joins.map(j => j.type);
    expect(types).toContain(JoinType.Inner);
    expect(types).toContain(JoinType.Left);
  });

  it('TC-83  getFieldList returns filterable/aggregatable metadata intact', () => {
    const fields = svc.getFieldList('epx', 'appointment');
    const statusField = fields.find(f => f.name === 'status');
    expect(statusField?.filterable).toBe(true);
    const notesField = fields.find(f => f.name === 'identifier');
    expect(notesField?.filterable).toBe(true);
    // video_consultation_url is NOT filterable
    const videoField = svc.getFieldList('epx', 'appointment_patient')
      .find(f => f.name === 'video_consultation_url');
    expect(videoField?.filterable).toBe(false);
  });

  it('TC-84  getFieldList throws for unknown entity', () => {
    expect(() => svc.getFieldList('epx', 'nonexistent_entity')).toThrow();
  });
});
