import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QueryService } from '../../../../services/query.service';
import {
  EntityDef, FieldDef, FilterCondition, FilterGroup, FilterLogic,
  FilterOperator, DateRangePreset, FieldType,
} from '../../../../core/query-types';

let _nextGroupId = 0;
function newGroupId(): string { return `fg${++_nextGroupId}`; }

@Component({
  selector: 'app-filter-builder',
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-builder.html',
  styleUrl: '../../config-panels/config-panels.scss',
})
export class FilterBuilder {
  @Input({ required: true }) product!: string;
  /** Restrict entity dropdown to these entity names (the current query's entity scope). */
  @Input() entityScope: string[] = [];
  @Input() filterGroups: FilterGroup[] = [];
  @Output() filterGroupsChange = new EventEmitter<FilterGroup[]>();

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

  get hasGroups(): boolean {
    return this.filterGroups.length > 0;
  }

  get totalConditions(): number {
    return this.filterGroups.reduce((sum, group) => sum + group.conditions.length, 0);
  }

  // ── Group CRUD ──────────────────────────────────────────────────────────

  addGroup(): void {
    const firstEntity = this.entities[0]?.name ?? '';
    const firstField  = this.filterableFields(firstEntity)[0]?.name ?? '';
    this.emit([...this.filterGroups, {
      id: newGroupId(),
      logic: 'AND',
      conditions: [{ entity: firstEntity, field: firstField, operator: FilterOperator.Eq, value: '' }],
    }]);
  }

  removeGroup(gi: number): void {
    this.emit(this.filterGroups.filter((_, i) => i !== gi));
  }

  toggleGroupLogic(gi: number): void {
    this.emit(this.filterGroups.map((g, i) =>
      i === gi ? { ...g, logic: (g.logic === 'AND' ? 'OR' : 'AND') as FilterLogic } : g
    ));
  }

  // ── Condition CRUD ──────────────────────────────────────────────────────

  addCondition(gi: number): void {
    const firstEntity = this.entities[0]?.name ?? '';
    const firstField  = this.filterableFields(firstEntity)[0]?.name ?? '';
    this.emit(this.filterGroups.map((g, i) =>
      i === gi
        ? { ...g, conditions: [...g.conditions, { entity: firstEntity, field: firstField, operator: FilterOperator.Eq, value: '' }] }
        : g
    ));
  }

  removeCondition(gi: number, ci: number): void {
    const updated = this.filterGroups
      .map((g, i) => i === gi ? { ...g, conditions: g.conditions.filter((_, j) => j !== ci) } : g)
      .filter(g => g.conditions.length > 0);   // auto-remove now-empty groups
    this.emit(updated);
  }

  updateCondition(gi: number, ci: number, patch: Partial<FilterCondition>): void {
    this.emit(this.filterGroups.map((g, i) =>
      i === gi
        ? { ...g, conditions: g.conditions.map((c, j) => j === ci ? { ...c, ...patch } : c) }
        : g
    ));
  }

  onEntityChange(gi: number, ci: number, entity: string): void {
    const firstField = this.filterableFields(entity)[0]?.name ?? '';
    this.updateCondition(gi, ci, { entity, field: firstField, value: '', values: undefined, dateRange: undefined });
  }

  onOperatorChange(gi: number, ci: number, op: FilterOperator): void {
    this.updateCondition(gi, ci, { operator: op, value: '', values: undefined, dateRange: undefined });
  }

  // ── Field helpers ───────────────────────────────────────────────────────

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

  isMultiValue(op: FilterOperator): boolean { return op === FilterOperator.In || op === FilterOperator.NotIn; }
  isDateRange(op:  FilterOperator): boolean { return op === FilterOperator.DateRange; }
  isNoValue(op:    FilterOperator): boolean { return op === FilterOperator.IsNull || op === FilterOperator.IsNotNull; }

  valuesStr(c: FilterCondition): string { return (c.values ?? []).join(', '); }

  setValues(gi: number, ci: number, raw: string): void {
    this.updateCondition(gi, ci, { values: raw.split(',').map(s => s.trim()).filter(Boolean) });
  }

  presetList(): DateRangePreset[] { return Object.values(DateRangePreset); }

  groupSummary(group: FilterGroup): string {
    const count = group.conditions.length;
    const noun = count === 1 ? 'condition' : 'conditions';
    return `${count} ${noun} using ${group.logic}`;
  }

  operatorLabel(op: FilterOperator): string {
    const labels: Record<FilterOperator, string> = {
      [FilterOperator.Eq]: 'Equals',
      [FilterOperator.Neq]: 'Does not equal',
      [FilterOperator.In]: 'Is any of',
      [FilterOperator.NotIn]: 'Is none of',
      [FilterOperator.Gt]: 'Greater than',
      [FilterOperator.Gte]: 'Greater or equal',
      [FilterOperator.Lt]: 'Less than',
      [FilterOperator.Lte]: 'Less or equal',
      [FilterOperator.IsNull]: 'Is empty',
      [FilterOperator.IsNotNull]: 'Is not empty',
      [FilterOperator.DateRange]: 'Is within date range',
      [FilterOperator.Contains]: 'Contains',
    };
    return labels[op] ?? op;
  }

  presetLabel(preset: DateRangePreset): string {
    const labels: Record<DateRangePreset, string> = {
      [DateRangePreset.Today]: 'Today',
      [DateRangePreset.Yesterday]: 'Yesterday',
      [DateRangePreset.Last7Days]: 'Last 7 days',
      [DateRangePreset.Last30Days]: 'Last 30 days',
      [DateRangePreset.Last90Days]: 'Last 90 days',
      [DateRangePreset.ThisMonth]: 'This month',
      [DateRangePreset.LastMonth]: 'Last month',
      [DateRangePreset.ThisYear]: 'This year',
      [DateRangePreset.LastYear]: 'Last year',
    };
    return labels[preset] ?? preset;
  }

  conditionValueSummary(c: FilterCondition): string {
    if (this.isNoValue(c.operator)) return 'No value needed';
    if (this.isDateRange(c.operator)) {
      return c.dateRange?.preset ? this.presetLabel(c.dateRange.preset) : 'Custom date range';
    }
    if (this.isMultiValue(c.operator)) {
      const count = c.values?.length ?? 0;
      return count ? `${count} value${count === 1 ? '' : 's'}` : 'Add one or more values';
    }
    const value = c.value;
    return value === undefined || value === null || value === '' ? 'Enter a value' : String(value);
  }

  private emit(groups: FilterGroup[]): void {
    this.filterGroupsChange.emit(groups);
  }
}
