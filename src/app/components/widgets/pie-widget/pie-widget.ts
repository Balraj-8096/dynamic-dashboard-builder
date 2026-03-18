
// ═══════════════════════════════════════════════════════════════
//  DASHCRAFT — Pie / Donut Chart Widget
//  Part-to-whole distribution chart
//  Supports: donut hole, labels, legend
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
import { mapPieResult } from '../../../core/query-result-mapper';
import { WidgetDatePickerComponent, DatePickerChange } from '../../shared/widget-date-picker/widget-date-picker';
import { FilterCondition } from '../../../core/query-types';

import {
  ApexNonAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexLegend,
  ApexTooltip,
  ApexPlotOptions,
  ApexStroke,
} from 'ng-apexcharts';
import { PieConfig, Widget } from '../../../core/interfaces';
import { CHART_COLORS } from '../../../core/constants';



export interface PieChartOptions {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  colors: string[];
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  tooltip: ApexTooltip;
  plotOptions: ApexPlotOptions;
  stroke: ApexStroke;
}

@Component({
  selector: 'app-pie-widget',
  imports: [CommonModule, NgApexchartsModule, WidgetDatePickerComponent],
  templateUrl: './pie-widget.html',
  styleUrl: './pie-widget.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PieWidget implements OnChanges {

  @Input({ required: true }) widget!: Widget;
  @Input() contentH: number = 200;

  chartOptions?: PieChartOptions;

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

  get cfg(): PieConfig {
    return this.widget.config as PieConfig;
  }

  ngOnChanges(): void {
    this.buildChart();
  }

  private buildChart(): void {
    const cfg = this.cfg;

    let activeData = cfg?.data ?? [];
    if (cfg?.queryConfig) {
      try {
        const effectiveQcfg = this.localDateFilter
          ? { ...cfg.queryConfig, filters: [...(cfg.queryConfig.filters ?? []), this.localDateFilter] }
          : cfg.queryConfig;
        activeData = mapPieResult(this.qsvc.executePieQuery(effectiveQcfg));
      } catch { /* keep static */ }
    }
    if (!activeData.length) { this.chartOptions = undefined; return; }

    const data   = activeData;
    const series = data.map(d => d.value);
    const labels = data.map(d => d.name);
    const colors = data.map((d, i) => d.color ?? CHART_COLORS[i % CHART_COLORS.length]);

    this.chartOptions = {
      series,
      labels,
      colors,

      chart: {
        type: 'donut',
        height: this.contentH - 8,
        background: 'transparent',
        toolbar: { show: false },
        animations: { enabled: true, speed: 400 },
      },

      plotOptions: {
        pie: {
          donut: {
            size: `${cfg.innerRadius ?? 55}%`,
            labels: {
              show: false,
            },
          },
        },
      },

      stroke: {
        width: 2,
        colors: ['#0d1219'],
      },

      dataLabels: {
        enabled: cfg.showLabels,
        style: {
          fontSize: '10px',
          fontFamily: 'JetBrains Mono, monospace',
          colors: ['#e8edf5'],
        },
        dropShadow: { enabled: false },
      },

      legend: {
        show: cfg.showLegend,
        position: 'bottom',
        labels: { colors: '#8fa3be' },
        fontSize: '10px',
        fontFamily: 'JetBrains Mono, monospace',
        markers: { size: 6 },
        itemMargin: { horizontal: 8, vertical: 2 },
      },

      tooltip: {
        theme: 'dark',
        style: {
          fontSize: '11px',
          fontFamily: 'JetBrains Mono, monospace',
        },
        y: {
          formatter: (val: number) =>
            val.toLocaleString(),
        },
      },
    };
  }
}

