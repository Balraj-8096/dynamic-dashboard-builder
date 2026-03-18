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

  entityList: string[] = [];
  columns: Array<{ entity: string; field: string }> = [];
  sortEnabled   = false;
  sortEntity    = '';
  sortField     = '';
  sortDirection: SortDirection = SortDirection.Desc;
  pageSize      = 20;
  filterGroups: FilterGroup[] = [];

  // New-column picker
  newColEntity = '';
  newColField  = '';

  // Add-entity picker (explicit binding prevents stale DOM value)
  newAddEntity = '';

  ngOnInit(): void {
    if (this.config) {
      this.entityList   = [...this.config.entities];
      this.columns      = [...this.config.columns];
      this.sortEnabled  = !!this.config.sort;
      this.sortEntity   = this.config.sort?.entity    ?? '';
      this.sortField    = this.config.sort?.field     ?? '';
      this.sortDirection = this.config.sort?.direction ?? SortDirection.Desc;
      this.pageSize     = this.config.pageSize        ?? 20;
      if (this.config.filterGroups?.length) {
        this.filterGroups = [...this.config.filterGroups];
      } else if (this.config.filters?.length) {
        this.filterGroups = [{ id: 'legacy', logic: 'AND', conditions: [...this.config.filters] }];
      } else {
        this.filterGroups = [];
      }
    } else {
      const first = this.allEntities[0]?.name ?? '';
      this.entityList  = first ? [first] : [];
      this.newColEntity = first;
      this.newColField  = this.fieldsFor(first)[0]?.name ?? '';
      this.sortEntity   = first;
      this.sortField    = this.fieldsFor(first)[0]?.name ?? '';
      this.emit();
    }
    // Initialise picker to first entity if not already set
    if (!this.newColEntity && this.entityList.length) {
      this.newColEntity = this.entityList[0];
      this.newColField  = this.fieldsFor(this.newColEntity)[0]?.name ?? '';
    }
  }

  get allEntities(): EntityDef[] {
    if (!this.product) return [];
    return this.qsvc.getEntityList(this.product);
  }

  get availableEntities(): EntityDef[] {
    // Only show entities reachable via joins from already-selected entities
    const reachable = this.entityList.length
      ? this.qsvc.getReachableEntities(this.product, this.entityList)
      : this.allEntities;
    return reachable.filter(e => !this.entityList.includes(e.name));
  }

  fieldsFor(entity: string): FieldDef[] {
    if (!this.product || !entity) return [];
    try { return this.qsvc.getFieldList(this.product, entity); }
    catch { return []; }
  }

  sortDirections(): SortDirection[] { return Object.values(SortDirection); }

  addEntity(entity: string): void {
    if (!entity || this.entityList.includes(entity)) return;
    this.entityList  = [...this.entityList, entity];
    this.newAddEntity = '';   // reset picker so user must explicitly choose next
    this.emit();
  }

  removeEntity(entity: string): void {
    this.entityList = this.entityList.filter(e => e !== entity);
    this.columns    = this.columns.filter(c => c.entity !== entity);
    // Reset dependent pickers if they pointed to the removed entity
    if (this.newColEntity === entity) {
      this.newColEntity = this.entityList[0] ?? '';
      this.newColField  = this.fieldsFor(this.newColEntity)[0]?.name ?? '';
    }
    if (this.sortEntity === entity) {
      this.sortEntity = this.entityList[0] ?? '';
      this.sortField  = this.fieldsFor(this.sortEntity)[0]?.name ?? '';
    }
    this.emit();
  }

  onNewColEntityChange(entity: string): void {
    this.newColEntity = entity;
    this.newColField  = this.fieldsFor(entity)[0]?.name ?? '';
  }

  addColumn(): void {
    if (!this.newColEntity || !this.newColField) return;
    this.columns = [...this.columns, { entity: this.newColEntity, field: this.newColField }];
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
    return this.entityList.filter(Boolean);
  }

  emit(): void {
    const cfg: TableQueryConfig = {
      product:  this.product,
      entities: this.qsvc.buildEntityPath(this.product, this.entityList),
      columns:  this.columns,
      filterGroups: this.filterGroups.length ? this.filterGroups : undefined,
      sort: this.sortEnabled && this.sortEntity && this.sortField
        ? { entity: this.sortEntity, field: this.sortField, direction: this.sortDirection }
        : undefined,
      pageSize: this.pageSize,
    };
    this.configChange.emit(cfg);
  }
}
