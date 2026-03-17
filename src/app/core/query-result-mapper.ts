// ═══════════════════════════════════════════════════════════════
//  DASHCRAFT — Query Result Mappers
//  Pure functions: query result → widget display model
//
//  Each widget component calls the relevant mapper in ngOnChanges
//  when cfg.queryConfig is present, then uses the mapped data
//  for rendering instead of the static config values.
// ═══════════════════════════════════════════════════════════════

import {
  StatQueryResult,
  ChartQueryResult,
  PieQueryResult,
  TableQueryResult,
} from './query-types';

import {
  ChartSeries,
  PieSegment,
  TableColumn,
  TableRow,
  ProgressItem,
} from './interfaces';

import { CHART_COLORS } from './constants';


// ── Stat / Analytics ────────────────────────────────────────────

export interface StatDisplayData {
  value:        string;
  trend:        string;
  trendUp:      boolean;
  sparkData:    number[];
  changeLabel:  string;
  /** Active period label — auto-derived from date filters, or '' if none */
  periodLabel:  string;
}

export function mapStatResult(
  result: StatQueryResult,
  configPeriodLabel?: string,
): StatDisplayData {
  const pct  = result.changePercent ?? 0;
  const sign = pct > 0 ? '+' : '';
  return {
    value:       result.formattedValue,
    trend:       result.changePercent != null ? `${sign}${pct.toFixed(1)}%` : '',
    trendUp:     pct >= 0,
    sparkData:   result.trendHistory ?? [],
    changeLabel: result.previousValue != null ? 'vs previous period' : '',
    periodLabel: result.computedPeriodLabel ?? configPeriodLabel ?? '',
  };
}


// ── Bar / Line Chart ─────────────────────────────────────────────

export interface ChartDisplayData {
  series: ChartSeries[];
  labels: string[];
}

export function mapChartResult(result: ChartQueryResult): ChartDisplayData {
  return {
    labels: result.labels,
    series: result.series.map((s, i) => ({
      key:   s.name,
      color: CHART_COLORS[i % CHART_COLORS.length],
      data:  result.labels.map((label, j) => ({ n: label, v: s.data[j] ?? 0 })),
    })),
  };
}


// ── Pie / Donut ──────────────────────────────────────────────────

export function mapPieResult(result: PieQueryResult): PieSegment[] {
  return result.segments.map((seg, i) => ({
    name:  seg.label,
    value: seg.value,
    color: seg.color ?? CHART_COLORS[i % CHART_COLORS.length],
  }));
}


// ── Table ────────────────────────────────────────────────────────

export interface TableDisplayData {
  columns:   TableColumn[];
  rows:      TableRow[];
  totalRows: number;
}

export function mapTableResult(result: TableQueryResult): TableDisplayData {
  return {
    columns: result.columns.map(c => ({
      key:          c.key,
      label:        c.label,
      width:        'auto',
      type:         c.type,
      statusValues: c.statusValues,
    })),
    rows:      result.rows as TableRow[],
    totalRows: result.totalRows,
  };
}


// ── Progress ─────────────────────────────────────────────────────

export function mapProgressResults(
  results: StatQueryResult[],
  items:   ProgressItem[],
): ProgressItem[] {
  return items.map((item, i) => {
    const r = results[i];
    return r ? { ...item, value: Math.min(item.max, r.value) } : item;
  });
}
