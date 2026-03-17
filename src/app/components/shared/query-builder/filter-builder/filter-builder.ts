import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QueryService } from '../../../../services/query.service';
import {
  EntityDef, FieldDef, FilterCondition,
  FilterOperator, DateRangePreset, FieldType,
} from '../../../../core/query-types';

@Component({
  selector: 'app-filter-builder',
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-builder.html',
  styleUrl: '../../config-panels/config-panels.scss',
})
export class FilterBuilder {
  @Input({ required: true }) product!: string;
  /** Restrict filter entity dropdown to these entity names (the current query's entity scope). */
  @Input() entityScope: string[] = [];
  @Input() filters: FilterCondition[] = [];
  @Output() filtersChange = new EventEmitter<FilterCondition[]>();

  readonly FilterOperator = FilterOperator;
  readonly DateRangePreset = DateRangePreset;
  readonly FieldType = FieldType;

  private readonly qsvc = inject(QueryService);

  get entities(): EntityDef[] {
    if (!this.product) return [];
    const all = this.qsvc.getEntityList(this.product);
    if (!this.entityScope.length) return all;
    return all.filter(e => this.entityScope.includes(e.name));
  }

  fieldsFor(entity: string): FieldDef[] {
    if (!this.product || !entity) return [];
    try { return this.qsvc.getFieldList(this.product, entity); }
    catch { return []; }
  }

  filterableFields(entity: string): FieldDef[] {
    return this.fieldsFor(entity).filter(f => f.filterable);
  }

  addFilter(): void {
    const firstEntity = this.entities[0]?.name ?? '';
    const firstField  = this.filterableFields(firstEntity)[0]?.name ?? '';
    this.filtersChange.emit([...this.filters, {
      entity: firstEntity,
      field:  firstField,
      operator: FilterOperator.Eq,
      value: '',
    }]);
  }

  removeFilter(i: number): void {
    this.filtersChange.emit(this.filters.filter((_, idx) => idx !== i));
  }

  updateFilter(i: number, patch: Partial<FilterCondition>): void {
    this.filtersChange.emit(
      this.filters.map((f, idx) => idx === i ? { ...f, ...patch } : f)
    );
  }

  onEntityChange(i: number, entity: string): void {
    const firstField = this.filterableFields(entity)[0]?.name ?? '';
    this.updateFilter(i, { entity, field: firstField, value: '', values: undefined, dateRange: undefined });
  }

  onOperatorChange(i: number, op: FilterOperator): void {
    this.updateFilter(i, { operator: op, value: '', values: undefined, dateRange: undefined });
  }

  operators(entity: string, field: string): FilterOperator[] {
    const type = this.fieldsFor(entity).find(f => f.name === field)?.type ?? FieldType.String;
    const base = [FilterOperator.Eq, FilterOperator.Neq, FilterOperator.IsNull, FilterOperator.IsNotNull];
    if (type === FieldType.String)
      return [...base, FilterOperator.Contains, FilterOperator.In, FilterOperator.NotIn];
    if (type === FieldType.Number)
      return [...base, FilterOperator.Gt, FilterOperator.Gte, FilterOperator.Lt, FilterOperator.Lte, FilterOperator.In, FilterOperator.NotIn];
    if (type === FieldType.Datetime)
      return [...base, FilterOperator.Gt, FilterOperator.Gte, FilterOperator.Lt, FilterOperator.Lte, FilterOperator.DateRange];
    return base;
  }

  isMultiValue(op: FilterOperator): boolean {
    return op === FilterOperator.In || op === FilterOperator.NotIn;
  }
  isDateRange(op: FilterOperator): boolean { return op === FilterOperator.DateRange; }
  isNoValue(op:  FilterOperator): boolean {
    return op === FilterOperator.IsNull || op === FilterOperator.IsNotNull;
  }

  valuesStr(f: FilterCondition): string {
    return (f.values ?? []).join(', ');
  }

  setValues(i: number, raw: string): void {
    this.updateFilter(i, { values: raw.split(',').map(s => s.trim()).filter(Boolean) });
  }

  presetList(): DateRangePreset[] { return Object.values(DateRangePreset); }
}
