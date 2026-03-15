
// ═══════════════════════════════════════════════════════════════
//  DASHCRAFT — Progress Bars Widget
//  Multi-metric progress display with glow effects
// ═══════════════════════════════════════════════════════════════

import {
  Component,
  Input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressConfig, ProgressItem, Widget } from '../../../core/interfaces';

@Component({
  selector: 'app-progress-widget',
  imports: [CommonModule],
  templateUrl: './progress-widget.html',
  styleUrl: './progress-widget.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressWidget {

  @Input({ required: true }) widget!: Widget;
  @Input() contentH: number = 200;

  get cfg(): ProgressConfig {
    return this.widget.config as ProgressConfig;
  }

  // Guard against undefined items (Bug fix #7 React source)
  get items(): ProgressItem[] {
    return this.cfg?.items || [];
  }

  getPercent(item: ProgressItem): number {
    return Math.min(100, Math.round((item.value / item.max) * 100));
  }
}