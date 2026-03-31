
// ═══════════════════════════════════════════════════════════════
//  DASHCRAFT — Pie / Donut Chart Widget
//  Part-to-whole distribution chart
//  Supports: donut hole, labels, legend
// ═══════════════════════════════════════════════════════════════

import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  effect,
  untracked,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { QUERY_SERVICE_TOKEN }   from '../../../core/query-service.interface';
import { mapPieResult }          from '../../../core/query-result-mapper';
import { WidgetDatePickerComponent, DatePickerChange } from '../../shared/widget-date-picker/widget-date-picker';
import { FilterCondition }       from '../../../core/query-types';

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
export class PieWidget implements OnChanges, OnDestroy {

  @Input({ required: true }) widget!: Widget;
  @Input() contentH: number = 200;

  chartOptions?: PieChartOptions;
  isLoading = false;

  localDatePreset = '';
  private localDateFilter: FilterCondition | null = null;

  private readonly qsvc = inject(QUERY_SERVICE_TOKEN);
  private readonly cdr  = inject(ChangeDetectorRef);

  /** Cancels the in-flight subscription when a new refresh begins. */
  private buildSub?: Subscription;
  /** Completes all subscriptions on component destroy. */
  private readonly destroy$ = new Subject<void>();

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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get cfg(): PieConfig {
    return this.widget.config as PieConfig;
  }

  ngOnChanges(): void {
    this.buildChart();
  }

  private buildChart(): void {
    const cfg = this.cfg;

    if (cfg?.queryConfig) {
      // Cancel any previous in-flight request before starting a new one.
      this.buildSub?.unsubscribe();

      const effectiveQcfg = this.localDateFilter
        ? { ...cfg.queryConfig, filters: [...(cfg.queryConfig.filters ?? []), this.localDateFilter] }
        : cfg.queryConfig;

      this.isLoading = true;
      this.buildSub = this.qsvc.executePieQuery(effectiveQcfg)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: result => {
            const activeData = mapPieResult(result);
            this.applyChartOptions(cfg, activeData);
            this.isLoading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.isLoading = false;
            this.cdr.markForCheck();
          },
        });
    } else {
      // Static config path — synchronous, no subscription needed.
      this.applyChartOptions(cfg, cfg?.data ?? []);
    }
  }

  /** Builds and assigns the final ApexCharts options object. */
  private applyChartOptions(
    cfg: PieConfig,
    activeData: Array<{ name: string; value: number; color?: string }>,
  ): void {
    if (!activeData.length) { this.chartOptions = undefined; return; }

    const series = activeData.map(d => d.value);
    const labels = activeData.map(d => d.name);
    const colors = activeData.map((d, i) => d.color ?? CHART_COLORS[i % CHART_COLORS.length]);

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
