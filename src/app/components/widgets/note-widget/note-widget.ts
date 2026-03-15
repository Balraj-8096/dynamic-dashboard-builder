
// ═══════════════════════════════════════════════════════════════
//  DASHCRAFT — Note / Text Widget
//  Free-text annotation block with accent border
// ═══════════════════════════════════════════════════════════════

import {
  Component,
  Input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoteConfig, Widget } from '../../../core/interfaces';

@Component({
  selector: 'app-note-widget',
  imports: [CommonModule],
  templateUrl: './note-widget.html',
  styleUrl: './note-widget.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoteWidget {

  @Input({ required: true }) widget!: Widget;
  @Input() contentH: number = 120;

  get cfg(): NoteConfig {
    return this.widget.config as NoteConfig;
  }

  /**
   * Split content by newlines for multi-line rendering.
   */
  get lines(): string[] {
    return (this.cfg?.content || '').split('\n');
  }

  get fontSize(): string {
    return `${this.cfg?.fontSize || '13'}px`;
  }
}

