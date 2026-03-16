import { Component, EventEmitter, Input, Output } from '@angular/core';
import { StatConfig } from '../../../core/interfaces';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-stat-config',
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-stat-config.html',
  styleUrl: '../config-panels/config-panels.scss',
})
export class EditStatConfig {
  @Input({ required: true }) cfg!: StatConfig;
  @Output() cfgChange = new EventEmitter<StatConfig>();

  upd(key: keyof StatConfig, value: any): void {
    this.cfgChange.emit({ ...this.cfg, [key]: value });
  }

  get sparkDataStr(): string {
    return (this.cfg.sparkData ?? []).join(',');
  }

  setSparkData(raw: string): void {
    this.upd('sparkData', raw.split(',').map(n => parseFloat(n.trim()) || 0));
  }

}
