// ═══════════════════════════════════════════════════════════════
//  DASHCRAFT — Data Table Widget
//  Sortable data table with status badges
//  Uses Angular Material MatTable
// ═══════════════════════════════════════════════════════════════

import {
  Component,
  Input,
  OnChanges,
  ChangeDetectorRef,
  effect,
  untracked,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { TableColumn, TableConfig, TableRow, Widget } from '../../../core/interfaces';
import { STATUS_FALLBACK, STATUS_MAP } from '../../../core/constants';
import { QueryService } from '../../../services/query.service';
import { mapTableResult } from '../../../core/query-result-mapper';
import { WidgetDatePickerComponent, DatePickerChange } from '../../shared/widget-date-picker/widget-date-picker';
import { FilterCondition } from '../../../core/query-types';

@Component({
  selector: 'app-table-widget',
  imports:         [CommonModule, MatTableModule, WidgetDatePickerComponent],
  templateUrl: './table-widget.html',
  styleUrl: './table-widget.scss',
})
export class TableWidget implements OnChanges {

  @Input({ required: true }) widget!: Widget;
  @Input() contentH: number = 200;

  // Displayed column keys for MatTable
  displayedColumns: string[] = [];

  // Pagination state
  currentPage = 1;
  totalRows   = 0;

  get pageSize(): number {
    return this.cfg?.queryConfig?.pageSize ?? 20;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalRows / this.pageSize));
  }

  private readonly qsvc = inject(QueryService);
  private readonly cdr  = inject(ChangeDetectorRef);

  // Track last queryConfig reference to reset page when config changes
  private _lastQueryCfgRef: object | undefined;

  constructor() {
    effect(() => {
      this.qsvc.globalFilters();
      untracked(() => { if (this.widget) { this.currentPage = 1; this.refresh(); this.cdr.markForCheck(); } });
    });
  }

  localDatePreset = '';
  private localDateFilter: FilterCondition | null = null;

  onDateChange(e: DatePickerChange): void {
    this.localDateFilter = e.filter;
    this.localDatePreset  = e.preset;
    this.currentPage = 1;
    this.refresh();
    this.cdr.markForCheck();
  }

  goToPage(page: number): void {
    const clamped = Math.max(1, Math.min(page, this.totalPages));
    if (clamped === this.currentPage) return;
    this.currentPage = clamped;
    this.refresh();
    this.cdr.markForCheck();
  }

  private _displayCols: TableColumn[] | null = null;
  private _displayRows: TableRow[]   | null = null;

  get cfg(): TableConfig {
    return this.widget.config as TableConfig;
  }

  get cols(): TableColumn[] {
    return this._displayCols ?? this.cfg?.columns ?? [];
  }

  get rows(): TableRow[] {
    return this._displayRows ?? this.cfg?.rows ?? [];
  }

  ngOnChanges(): void {
    // Reset to page 1 when the query config object changes (e.g. after saving edits)
    const qcfg = this.cfg?.queryConfig;
    if (qcfg !== this._lastQueryCfgRef) {
      this.currentPage      = 1;
      this._lastQueryCfgRef = qcfg;
    }
    this.refresh();
  }

  private refresh(): void {
    if (this.cfg?.queryConfig) {
      try {
        const effectiveQcfg = {
          ...(this.localDateFilter
            ? { ...this.cfg.queryConfig, filters: [...(this.cfg.queryConfig.filters ?? []), this.localDateFilter] }
            : this.cfg.queryConfig),
          page: this.currentPage,
        };
        const result = this.qsvc.executeTableQuery(effectiveQcfg);
        const mapped = mapTableResult(result);
        this.totalRows = result.totalRows;
        // Prefer cfg.columns (user-configured visible columns) so that source fields
        // fetched for derived/combined columns don't appear as extra table columns.
        this._displayCols = this.cfg.columns?.length ? this.cfg.columns : mapped.columns;
        this._displayRows = mapped.rows;
      } catch {
        this._displayCols = null;
        this._displayRows = null;
        this.totalRows    = 0;
      }
    } else {
      this._displayCols = null;
      this._displayRows = null;
      this.totalRows    = 0;
    }
    this.displayedColumns = this.cols.map(c => c.key);
  }

  /**
   * Get status badge style for a cell value.
   * Only applied when cfg.statusColumn === true
   * and the column key is 'status'.
   */
  getStatusStyle(value: unknown): {
    bg: string;
    fg: string;
    label: string;
  } {
    const key = String(value ?? '').toLowerCase();
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
  getCellValue(row: TableRow, key: string): unknown {
    return row[key] ?? '';
  }
}

