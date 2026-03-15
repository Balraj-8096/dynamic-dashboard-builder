// ═══════════════════════════════════════════════════════════════
//  DASHCRAFT — Stat Widget Component
//  Single KPI tile with trend indicator and sparkline
//
//  Two render modes:
//  ├── Single field mode — large value, trend, sparkline
//  └── Multi field mode  — 2-3 column grid of mini KPI tiles
//      activated when selectedFields.length > 1
//
//  Direct port from React StatContent component
// ═══════════════════════════════════════════════════════════════

import {
  Component,
  Input,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatConfig, Widget } from '../../../core/interfaces';
import { DATA_SCHEMA } from '../../../core/data-schema';


@Component({
  selector: 'app-stat-widget',
  imports: [],
  templateUrl: './stat-widget.html',
  styleUrl: './stat-widget.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatWidget {

  @Input({ required: true }) widget!: Widget;
  @Input() contentH: number = 120;

  // ── Config accessor ──────────────────────────────────────────
  get cfg(): StatConfig {
    return this.widget.config as StatConfig;
  }

  // ── Multi-field mode ─────────────────────────────────────────

  /**
   * Selected KPI fields from DATA_SCHEMA.
   * Populated when user selects fields in wizard or edit modal.
   * null = single field mode (use cfg.value directly)
   */
  get selectedFields() {
    const ids = this.cfg.selectedFields;
    if (!ids?.length) return null;
    return ids
      .map(id => DATA_SCHEMA.kpi.find(f => f.id === id))
      .filter(Boolean) as typeof DATA_SCHEMA.kpi;
  }

  /**
   * Whether to render in multi-field grid mode.
   * True when 2+ fields selected.
   */
  get isMultiField(): boolean {
    const f = this.selectedFields;
    return f !== null && f.length > 1;
  }

  /**
   * Column count for multi-field grid.
   * 1-2 fields = 2 cols, 3-4 fields = 2 cols, 5+ = 3 cols
   */
  get multiCols(): number {
    const count = this.selectedFields?.length ?? 0;
    if (count <= 2) return 2;
    if (count <= 4) return 2;
    return 3;
  }

  // ── Sparkline helpers ────────────────────────────────────────

  /**
   * Generate sparkline bar heights as percentages.
   * Each bar height = (value / max) * 100%
   * Last bar is full opacity, others at 35% (matches React)
   */
  getSparkBars(data: number[]): {
    height: string;
    opacity: number;
  }[] {
    if (!data?.length) return [];
    const max = Math.max(...data, 1);
    return data.map((v, i) => ({
      height: `${(v / max) * 100}%`,
      opacity: i === data.length - 1 ? 1 : 0.35,
    }));
  }

  /**
   * Generate SVG path for mini area chart.
   * Used in single-field sparkline.
   */
  getSparklinePath(data: number[]): {
    linePath: string;
    fillPath: string;
  } {
    if (!data?.length) return { linePath: '', fillPath: '' };

    const h = 32;
    const w = 100;
    const max = Math.max(...data, 1);
    const min = Math.min(...data);

    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * (h * 0.85) - 4;
      return `${x},${y}`;
    });

    const linePath = `M${pts.join(' L')}`;
    const fillPath = `${linePath} L${w},${h} L0,${h} Z`;

    return { linePath, fillPath };
  }

  /**
   * Gradient ID for sparkline — unique per widget.
   * Prevents gradient conflicts when multiple stat widgets shown.
   */
  get gradientId(): string {
    const color = (this.cfg.accent || '#3b82f6').replace('#', '');
    return `sg_${color}_${this.widget.id}`;
  }
}
