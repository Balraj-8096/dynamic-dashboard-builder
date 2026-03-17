// ═══════════════════════════════════════════════════════════════
//  DASHCRAFT — Analytics Widget Component
//  Compact metric card with area sparkline chart
//
//  Layout:
//  ├── Top: large value + change badge
//  ├── Middle: mini SVG area chart
//  └── Bottom: period label
//
//  Direct port from React AnalyticsContent component
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
import { AnalyticsConfig, Widget } from '../../../core/interfaces';
import { QueryService } from '../../../services/query.service';
import { mapStatResult } from '../../../core/query-result-mapper';

@Component({
  selector: 'app-analytics-widget',
  imports: [CommonModule],
  templateUrl: './analytics-widget.html',
  styleUrl: './analytics-widget.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsWidget implements OnChanges {

  @Input({ required: true }) widget!: Widget;
  @Input() contentH: number = 120;

  private readonly qsvc = inject(QueryService);
  private readonly cdr  = inject(ChangeDetectorRef);

  constructor() {
    effect(() => {
      this.qsvc.globalFilters();
      untracked(() => { if (this.widget) { this.refresh(); this.cdr.markForCheck(); } });
    });
  }

  // ── Display state ────────────────────────────────────────────
  displayValue       = '';
  displayChangeValue = '';
  displayChangeLabel = '';
  displayTrendUp     = true;
  displayData:       number[] = [];
  displayPeriod      = '';

  // ── Config accessor ──────────────────────────────────────────
  get cfg(): AnalyticsConfig {
    return this.widget.config as AnalyticsConfig;
  }

  ngOnChanges(): void { this.refresh(); }

  private refresh(): void {
    const qcfg = this.cfg?.queryConfig;
    if (qcfg) {
      try {
        const result = this.qsvc.executeStatQuery(qcfg);
        const mapped = mapStatResult(result, qcfg.periodLabel);
        this.displayValue       = mapped.value;
        this.displayChangeValue = mapped.trend;
        this.displayChangeLabel = mapped.changeLabel;
        this.displayTrendUp     = mapped.trendUp;
        this.displayData        = mapped.sparkData;
        this.displayPeriod      = mapped.periodLabel;
      } catch {
        this.displayValue = 'Error';
      }
    } else {
      this.displayValue       = this.cfg?.value       ?? '';
      this.displayChangeValue = this.cfg?.changeValue ?? '';
      this.displayChangeLabel = this.cfg?.changeLabel ?? '';
      this.displayTrendUp     = this.cfg?.trendUp     ?? true;
      this.displayData        = this.cfg?.data        ?? [];
      this.displayPeriod      = this.cfg?.period      ?? '';
    }
  }

  // ── SVG area chart ───────────────────────────────────────────

  /**
   * SVG viewport dimensions
   */
  readonly svgW = 100;
  readonly svgH = 48;

  /**
   * Generate SVG path data for area chart line and fill.
   * Normalizes data to fit within SVG viewport.
   * Direct port from React MiniArea component.
   */
  getAreaPaths(data: number[]): {
    linePath: string;
    fillPath: string;
  } {
    if (!data?.length || data.length < 2) {
      return { linePath: '', fillPath: '' };
    }

    const h = this.svgH;
    const w = this.svgW;
    const max = Math.max(...data, 1);
    const min = Math.min(...data);

    // Map data points to SVG coordinates
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1))
        * (h * 0.85) - 4;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });

    const linePath = `M${pts.join(' L')}`;
    const fillPath = `${linePath} L${w},${h} L0,${h} Z`;

    return { linePath, fillPath };
  }

  /**
   * Gradient ID — unique per widget to prevent SVG conflicts.
   */
  get gradientId(): string {
    const color = (this.cfg?.accent || '#22c55e').replace('#', '');
    return `ag_${color}_${this.widget.id}`;
  }

  /**
   * Accent color with fallback.
   */
  get accent(): string {
    return this.cfg?.accent || '#22c55e';
  }
}
