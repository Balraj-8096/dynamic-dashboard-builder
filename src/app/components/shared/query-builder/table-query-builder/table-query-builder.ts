import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QueryService } from '../../../../services/query.service';
import {
  EntityDef, FieldDef, FilterGroup,
  TableQueryConfig, SortDirection,
} from '../../../../core/query-types';
import { FilterBuilder } from '../filter-builder/filter-builder';

@Component({
  selector: 'app-table-query-builder',
  imports: [CommonModule, FormsModule, FilterBuilder],
  templateUrl: './table-query-builder.html',
  styleUrl: '../../config-panels/config-panels.scss',
})
export class TableQueryBuilder implements OnInit {
  @Input({ required: true }) product!: string;
  @Input() config: TableQueryConfig | null = null;
  @Output() configChange = new EventEmitter<TableQueryConfig>();

  readonly SortDirection = SortDirection;

  private readonly qsvc = inject(QueryService);

  rootEntity    = '';
  columns: Array<{ entity: string; field: string }> = [];
  sortEnabled   = false;
  sortEntity    = '';
  sortField     = '';
  sortDirection: SortDirection = SortDirection.Desc;
  pageSize      = 20;
  filterGroups: FilterGroup[] = [];

  ngOnInit(): void {
    if (this.config) {
      this.rootEntity    = this.config.entities[0] ?? '';
      this.columns       = [...this.config.columns];
      this.sortEnabled   = !!this.config.sort;
      this.sortEntity    = this.config.sort?.entity    ?? '';
      this.sortField     = this.config.sort?.field     ?? '';
      this.sortDirection = this.config.sort?.direction ?? SortDirection.Desc;
      this.pageSize      = this.config.pageSize        ?? 20;
      if (this.config.filterGroups?.length) {
        this.filterGroups = [...this.config.filterGroups];
      } else if (this.config.filters?.length) {
        this.filterGroups = [{ id: 'legacy', logic: 'AND', conditions: [...this.config.filters] }];
      } else {
        this.filterGroups = [];
      }
    } else {
      const first = this.allEntities[0]?.name ?? '';
      this.rootEntity = first;
      this.sortEntity = first;
      this.sortField  = this.fieldsFor(first)[0]?.name ?? '';
      this.emit();
    }
  }

  get allEntities(): EntityDef[] {
    if (!this.product) return [];
    return this.qsvc.getEntityList(this.product);
  }

  /** All entities reachable from the root via joins (includes root itself). */
  get reachableEntities(): EntityDef[] {
    if (!this.rootEntity) return [];
    return this.qsvc.getReachableEntities(this.product, [this.rootEntity]);
  }

  /** Entities that are currently referenced by selected columns (used to scope the sort picker). */
  get usedEntities(): string[] {
    const set = new Set<string>([this.rootEntity].filter(Boolean));
    for (const col of this.columns) set.add(col.entity);
    return [...set];
  }

  fieldsFor(entity: string): FieldDef[] {
    if (!this.product || !entity) return [];
    try { return this.qsvc.getFieldList(this.product, entity); }
    catch { return []; }
  }

  sortDirections(): SortDirection[] { return Object.values(SortDirection); }

  onRootEntityChange(entity: string): void {
    this.rootEntity = entity;
    const reachable = new Set(
      this.qsvc.getReachableEntities(this.product, [entity]).map(e => e.name)
    );
    // Drop columns whose entity is no longer reachable from the new root
    this.columns = this.columns.filter(c => reachable.has(c.entity));
    // Reset sort entity if it became unreachable
    if (!reachable.has(this.sortEntity)) {
      this.sortEntity = entity;
      this.sortField  = this.fieldsFor(entity)[0]?.name ?? '';
    }
    // Drop filter conditions whose entity is no longer reachable
    this.filterGroups = this.filterGroups
      .map(g => ({ ...g, conditions: g.conditions.filter(c => reachable.has(c.entity)) }))
      .filter(g => g.conditions.length > 0);
    this.emit();
  }

  isColumnSelected(entity: string, field: string): boolean {
    return this.columns.some(c => c.entity === entity && c.field === field);
  }

  toggleColumn(entity: string, field: string): void {
    if (this.isColumnSelected(entity, field)) {
      this.columns = this.columns.filter(c => !(c.entity === entity && c.field === field));
    } else {
      this.columns = [...this.columns, { entity, field }];
    }
    this.emit();
  }

  removeColumn(i: number): void {
    this.columns = this.columns.filter((_, idx) => idx !== i);
    this.emit();
  }

  onSortEntityChange(entity: string): void {
    this.sortEntity = entity;
    this.sortField  = this.fieldsFor(entity)[0]?.name ?? '';
    this.emit();
  }

  get filterScope(): string[] {
    return this.usedEntities;
  }

  emit(): void {
    // Compute entity join path from all entities referenced in columns, sort, and filters
    const used = new Set<string>([this.rootEntity].filter(Boolean));
    for (const col of this.columns) used.add(col.entity);
    if (this.sortEnabled && this.sortEntity) used.add(this.sortEntity);
    for (const fg of this.filterGroups) for (const c of fg.conditions) used.add(c.entity);

    const cfg: TableQueryConfig = {
      product:      this.product,
      entities:     this.qsvc.buildEntityPath(this.product, [...used]),
      columns:      this.columns,
      filterGroups: this.filterGroups.length ? this.filterGroups : undefined,
      sort: this.sortEnabled && this.sortEntity && this.sortField
        ? { entity: this.sortEntity, field: this.sortField, direction: this.sortDirection }
        : undefined,
      pageSize: this.pageSize,
    };
    this.configChange.emit(cfg);
  }
}
