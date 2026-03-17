// ═══════════════════════════════════════════════════════════════
//  DASHCRAFT — Bar Chart Widget Component
//  Multi-series bar chart
//  Supports: vertical, horizontal, stacked modes
//
//  Uses ng-apexcharts for rendering
//  Direct port from React BarContent component
// ═══════════════════════════════════════════════════════════════

import {
  Component,
  Input,
  OnChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  effect,
  untracked,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { QueryService } from '../../../services/query.service';
import { mapChartResult } from '../../../core/query-result-mapper';

import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexDataLabels,
  ApexGrid,
  ApexLegend,
  ApexTooltip,
  ApexPlotOptions,
  ApexStroke,
  ApexFill,
} from 'ng-apexcharts';
import { BarConfig, Widget } from '../../../core/interfaces';
import { CHART_COLORS } from '../../../core/constants';



export interface BarChartOptions {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  legend: ApexLegend;
  tooltip: ApexTooltip;
  plotOptions: ApexPlotOptions;
  stroke: ApexStroke;
  fill: ApexFill;
  colors: string[];
}


@Component({
  selector: 'app-bar-widget',
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './bar-widget.html',
  styleUrl: './bar-widget.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarWidget implements OnChanges {

  @Input({ required: true }) widget!: Widget;
  @Input() contentH: number = 200;

  chartOptions?: BarChartOptions;

  private readonly qsvc = inject(QueryService);
  private readonly cdr  = inject(ChangeDetectorRef);

  constructor() {
    effect(() => {
      this.qsvc.globalFilters(); // reactive dependency
      untracked(() => { if (this.widget) { this.buildChart(); this.cdr.markForCheck(); } });
    });
  }

  // ── Config accessor ──────────────────────────────────────────
  get cfg(): BarConfig {
    return this.widget.config as BarConfig;
  }

  ngOnChanges(): void {
    this.buildChart();
  }

  // ── Chart builder ────────────────────────────────────────────
  private buildChart(): void {
    const cfg = this.cfg;

    // Resolve series + categories: query result OR static config
    let activeSeries = cfg?.series ?? [];
    let activeCategories: string[] = activeSeries[0]?.data.map(d => d.n) ?? [];

    if (cfg?.queryConfig) {
      try {
        const result = this.qsvc.executeChartQuery(cfg.queryConfig);
        const mapped = mapChartResult(result);
        activeSeries     = mapped.series;
        activeCategories = mapped.labels;
      } catch { /* keep static */ }
    }

    const series: ApexAxisChartSeries = activeSeries.map(s => ({
      name: s.key,
      data: s.data.map(d => d.v),
    }));

    const categories = activeCategories;

    const colors = activeSeries.map(
      (s, i) => s.color || CHART_COLORS[i % CHART_COLORS.length]
    );

    this.chartOptions = {
      series,
      colors,

      chart: {
        type: cfg.horizontal ? 'bar' : 'bar',
        height: this.contentH - 8,
        background: 'transparent',
        toolbar: { show: false },
        sparkline: { enabled: false },
        animations: {
          enabled: true,
          speed: 400,
        },
      },

      plotOptions: {
        bar: {
          horizontal: cfg.horizontal,
          columnWidth: '60%',
          borderRadius: 3,
          dataLabels: { position: 'top' },
        },
      },

      stroke: {
        show: true,
        width: 2,
        colors: ['transparent'],
      },

      fill: {
        opacity: cfg.stacked ? 0.85 : 1,
      },

      dataLabels: {
        enabled: false,
      },

      grid: {
        show: cfg.showGrid,
        borderColor: '#1e2d42',
        strokeDashArray: 3,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: cfg.showGrid } },
        padding: { top: 0, right: 8, bottom: 0, left: 8 },
      },

      xaxis: {
        categories,
        labels: {
          style: {
            colors: '#526070',
            fontSize: '10px',
            fontFamily: 'JetBrains Mono, monospace',
          },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },

      yaxis: {
        labels: {
          style: {
            colors: '#526070',
            fontSize: '10px',
            fontFamily: 'JetBrains Mono, monospace',
          },
          formatter: (val: number) => {
            if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
            return `${val}`;
          },
        },
      },

      legend: {
        show: cfg.showLegend,
        position: 'top',
        labels: { colors: '#8fa3be' },
        fontSize: '11px',
        fontFamily: 'JetBrains Mono, monospace',
        markers: { size: 6 },
      },

      tooltip: {
        theme: 'dark',
        style: {
          fontSize: '11px',
          fontFamily: 'JetBrains Mono, monospace',
        },
        y: {
          formatter: (val: number) =>
            val >= 1000
              ? `${(val / 1000).toFixed(1)}k`
              : `${val}`,
        },
      },
    };
  }
}
