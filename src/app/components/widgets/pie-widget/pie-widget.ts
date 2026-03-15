
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
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';

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
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './pie-widget.html',
  styleUrl: './pie-widget.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PieWidget implements OnChanges {

  @Input({ required: true }) widget!: Widget;
  @Input() contentH: number = 200;

  chartOptions!: PieChartOptions;

  get cfg(): PieConfig {
    return this.widget.config as PieConfig;
  }

  ngOnChanges(): void {
    this.buildChart();
  }

  private buildChart(): void {
    const cfg = this.cfg;
    if (!cfg?.data?.length) return;

    const data = cfg.data || [];
    const series = data.map(d => d.value);
    const labels = data.map(d => d.name);
    const colors = data.map(d => d.color);

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

