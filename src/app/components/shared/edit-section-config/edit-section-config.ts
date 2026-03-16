import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SectionConfig } from '../../../core/interfaces';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-section-config',
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-section-config.html',
  styleUrl: '../config-panels/config-panels.scss',
})
export class EditSectionConfig {
  @Input({ required: true }) cfg!: SectionConfig;
  @Output() cfgChange = new EventEmitter<SectionConfig>();

  upd(key: keyof SectionConfig, value: any): void {
    this.cfgChange.emit({ ...this.cfg, [key]: value });
  }
}

