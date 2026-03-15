// ═══════════════════════════════════════════════════════════════
//  DASHCRAFT — Data Table Widget
//  Sortable data table with status badges
//  Uses Angular Material MatTable
// ═══════════════════════════════════════════════════════════════

import {
  Component,
  Input,
  OnChanges,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { TableColumn, TableConfig, TableRow, Widget } from '../../../core/interfaces';
import { STATUS_FALLBACK, STATUS_MAP } from '../../../core/constants';

@Component({
  selector: 'app-table-widget',
  imports:         [CommonModule, MatTableModule],
  templateUrl: './table-widget.html',
  styleUrl: './table-widget.scss',
})
export class TableWidget implements OnChanges {

  @Input({ required: true }) widget!: Widget;
  @Input() contentH: number = 200;

  // Displayed column keys for MatTable
  displayedColumns: string[] = [];

  get cfg(): TableConfig {
    return this.widget.config as TableConfig;
  }

  // Guard against undefined (Bug fix #6 React source)
  get cols(): TableColumn[] {
    return this.cfg?.columns || [];
  }

  get rows(): TableRow[] {
    return this.cfg?.rows || [];
  }

  ngOnChanges(): void {
    this.displayedColumns = this.cols.map(c => c.key);
  }

  /**
   * Get status badge style for a cell value.
   * Only applied when cfg.statusColumn === true
   * and the column key is 'status'.
   */
  getStatusStyle(value: string): {
    bg: string;
    fg: string;
    label: string;
  } {
    const key = String(value).toLowerCase();
    return STATUS_MAP[key] || {
      ...STATUS_FALLBACK,
      label: value,
    };
  }

  /**
   * Check if a column should render status badges.
   */
  isStatusCol(col: TableColumn): boolean {
    return this.cfg?.statusColumn === true &&
           col.key === 'status';
  }

  /**
   * Get cell value from row by column key.
   */
  getCellValue(row: TableRow, key: string): string {
    return row[key] ?? '';
  }
}

