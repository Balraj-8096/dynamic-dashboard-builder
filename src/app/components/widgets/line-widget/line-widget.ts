// ═══════════════════════════════════════════════════════════════
//  DASHCRAFT — Line / Area Chart Widget Component
//  Multi-series line or area chart
//  Supports: area fill, smooth curves, dot markers
//
//  Uses ng-apexcharts for rendering
//  Direct port from React LineContent component
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
import { WidgetDatePickerComponent, DatePickerChange } from '../../shared/widget-date-picker/widget-date-picker';
import { FilterCondition } from '../../../core/query-types';

import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexDataLabels,
  ApexGrid,
  ApexLegend,
  ApexTooltip,
  ApexStroke,
  ApexFill,
  ApexMarkers,
} from 'ng-apexcharts';
import { LineConfig, Widget } from '../../../core/interfaces';
import { CHART_COLORS } from '../../../core/constants';



export interface LineChartOptions {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  legend: ApexLegend;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  fill: ApexFill;
  markers: ApexMarkers;
  colors: string[];
}


@Component({
  selector: 'app-line-widget',
  imports: [CommonModule, NgApexchartsModule, WidgetDatePickerComponent],
  templateUrl: './line-widget.html',
  styleUrl: './line-widget.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineWidget implements OnChanges {

  @Input({ required: true }) widget!: Widget;
  @Input() contentH: number = 200;

  chartOptions?: LineChartOptions;

  localDatePreset = '';
  private localDateFilter: FilterCondition | null = null;

  private readonly qsvc = inject(QueryService);
  private readonly cdr  = inject(ChangeDetectorRef);

  onDateChange(e: DatePickerChange): void {
    this.localDateFilter = e.filter;
    this.localDatePreset  = e.preset;
    this.buildChart();
    this.cdr.markForCheck();
  }

  constructor() {
    effect(() => {
      this.qsvc.globalFilters();
      untracked(() => { if (this.widget) { this.buildChart(); this.cdr.markForCheck(); } });
    });
  }

  get cfg(): LineConfig {
    return this.widget.config as LineConfig;
  }

  ngOnChanges(): void {
    this.buildChart();
  }

  private buildChart(): void {
    const cfg = this.cfg;

    let activeSeries     = cfg?.series ?? [];
    let activeCategories = activeSeries[0]?.data.map(d => d.n) ?? [];

    if (cfg?.queryConfig) {
      try {
        const effectiveQcfg = this.localDateFilter
          ? { ...cfg.queryConfig, filters: [...(cfg.queryConfig.filters ?? []), this.localDateFilter] }
          : cfg.queryConfig;
        const result = this.qsvc.executeChartQuery(effectiveQcfg);
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
        type: cfg.areaFill ? 'area' : 'line',
        height: this.contentH - 8,
        background: 'transparent',
        toolbar: { show: false },
        animations: {
          enabled: true,
          speed: 400,
        },
      },

      stroke: {
        curve: cfg.smooth ? 'smooth' : 'straight',
        width: 2,
      },

      fill: {
        type: cfg.areaFill ? 'gradient' : 'solid',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.35,
          opacityTo: 0.02,
          stops: [0, 100],
        },
      },

      markers: {
        size: cfg.showDots ? 4 : 0,
        strokeWidth: 0,
        hover: { size: 6 },
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
