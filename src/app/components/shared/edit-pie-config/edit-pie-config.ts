import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PieConfig, PieSegment } from '../../../core/interfaces';
import { CHART_COLORS } from '../../../core/constants';


@Component({
  selector: 'app-edit-pie-config',
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-pie-config.html',
   styleUrl: '../config-panels/config-panels.scss',
})
export class EditPieConfig {
  @Input({ required: true }) cfg!: PieConfig;
  @Output() cfgChange = new EventEmitter<PieConfig>();

  upd(key: keyof PieConfig, value: any): void {
    this.cfgChange.emit({ ...this.cfg, [key]: value });
  }

  get data(): PieSegment[] { return this.cfg.data ?? []; }
  get innerRadius(): number { return this.cfg.innerRadius ?? 55; }

  addSegment(): void {
    this.upd('data', [
      ...this.data,
      { name: `Segment ${this.data.length + 1}`, value: 100, color: CHART_COLORS[this.data.length % CHART_COLORS.length] },
    ]);
  }

  removeSegment(i: number): void {
    this.upd('data', this.data.filter((_, di) => di !== i));
  }

  updateSegment(i: number, key: keyof PieSegment, value: any): void {
    this.upd('data', this.data.map((d, di) => di === i ? { ...d, [key]: value } : d));
  }

  chartColor(i: number, override?: string): string {
    return override || CHART_COLORS[i % CHART_COLORS.length];
  }

  get radiusLabel(): string {
    return this.innerRadius === 0 ? 'Pie' : 'Donut';
  }
}
