// ═══════════════════════════════════════════════════════════════
//  DASHCRAFT — Section Label Widget
//  Full-width visual divider with title
//  Always w=12, h=1
// ═══════════════════════════════════════════════════════════════

import {
  Component,
  Input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionConfig, Widget } from '../../../core/interfaces';

@Component({
  selector: 'app-section-widget',
  imports: [],
  templateUrl: './section-widget.html',
  styleUrl: './section-widget.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionWidget {

  @Input({ required: true }) widget!: Widget;
  @Input() contentH: number = 40;

  get cfg(): SectionConfig {
    return this.widget.config as SectionConfig;
  }
}

