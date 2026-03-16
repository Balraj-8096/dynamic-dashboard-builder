import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AnalyticsConfig } from '../../../core/interfaces';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-analytics-config',
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-analytics-config.html',
  styleUrl: '../config-panels/config-panels.scss',
})
export class EditAnalyticsConfig {
  @Input({ required: true }) cfg!: AnalyticsConfig;
  @Output() cfgChange = new EventEmitter<AnalyticsConfig>();

  upd(key: keyof AnalyticsConfig, value: any): void {
    this.cfgChange.emit({ ...this.cfg, [key]: value });
  }

  get dataStr(): string {
    return (this.cfg.data ?? []).join(',');
  }

  setData(raw: string): void {
    this.upd('data', raw.split(',').map(n => parseFloat(n.trim()) || 0));
  }
}
