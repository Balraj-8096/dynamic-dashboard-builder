import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableColumn, TableConfig, TableRow } from '../../../core/interfaces';
import { STATUS_MAP } from '../../../core/constants';

@Component({
  selector: 'app-edit-table-config',
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-table-config.html',
  styleUrl: '../config-panels/config-panels.scss',
})
export class EditTableConfig {
  @Input({ required: true }) cfg!: TableConfig;
  @Output() cfgChange = new EventEmitter<TableConfig>();

  readonly statusEntries = Object.entries(STATUS_MAP);

  upd(key: keyof TableConfig, value: any): void {
    this.cfgChange.emit({ ...this.cfg, [key]: value });
  }

  get cols(): TableColumn[] { return this.cfg.columns ?? []; }
  get rows(): TableRow[] { return this.cfg.rows ?? []; }

  // ── Column operations ─────────────────────────────────────────
  updateCol(i: number, key: keyof TableColumn, value: any): void {
    this.upd('columns', this.cols.map((c, ci) => ci === i ? { ...c, [key]: value } : c));
  }

  addCol(): void {
    this.upd('columns', [...this.cols, { key: `col${this.cols.length + 1}`, label: `Column ${this.cols.length + 1}`, width: 'auto' }]);
  }

  removeCol(i: number): void {
    const key = this.cols[i]?.key;
    if (!key) return;
    this.cfgChange.emit({
      ...this.cfg,
      columns: this.cols.filter((_, ci) => ci !== i),
      rows: this.rows.map(r => { const { [key]: _, ...rest } = r; return rest; }),
    });
  }

  // ── Row operations ────────────────────────────────────────────
  updateRow(ri: number, key: string, value: any): void {
    this.upd('rows', this.rows.map((r, i) => i === ri ? { ...r, [key]: value } : r));
  }

  addRow(): void {
    const row: TableRow = {};
    this.cols.forEach(c => row[c.key] = '');
    this.upd('rows', [...this.rows, row]);
  }

  removeRow(i: number): void {
    this.upd('rows', this.rows.filter((_, ri) => ri !== i));
  }
}
