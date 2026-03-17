import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QueryService } from '../../../../services/query.service';
import {
  EntityDef, FieldDef, FilterCondition,
  PieQueryConfig, AggregationFunction,
} from '../../../../core/query-types';
import { FilterBuilder } from '../filter-builder/filter-builder';

@Component({
  selector: 'app-pie-query-builder',
  imports: [CommonModule, FormsModule, FilterBuilder],
  templateUrl: './pie-query-builder.html',
  styleUrl: '../../config-panels/config-panels.scss',
})
export class PieQueryBuilder implements OnInit {
  @Input({ required: true }) product!: string;
  @Input() config: PieQueryConfig | null = null;
  @Output() configChange = new EventEmitter<PieQueryConfig>();

  readonly AggregationFunction = AggregationFunction;

  private readonly qsvc = inject(QueryService);

  primaryEntity    = '';
  groupByEntity    = '';
  groupByField     = '';
  valueAggEntity   = '';
  valueAggField    = '';
  valueAggFunction: AggregationFunction = AggregationFunction.Count;
  topNEnabled      = false;
  topN             = 5;
  filters: FilterCondition[] = [];

  ngOnInit(): void {
    if (this.config) {
      this.primaryEntity    = this.config.entities[0]      ?? '';
      this.groupByEntity    = this.config.groupBy.entity;
      this.groupByField     = this.config.groupBy.field;
      this.valueAggEntity   = this.config.valueAgg.entity;
      this.valueAggField    = this.config.valueAgg.field;
      this.valueAggFunction = this.config.valueAgg.function;
      this.topNEnabled      = this.config.topN != null;
      this.topN             = this.config.topN ?? 5;
      this.filters          = [...(this.config.filters ?? [])];
    } else {
      const first = this.entities[0]?.name ?? '';
      this.primaryEntity  = first;
      this.groupByEntity  = first;
      this.groupByField   = this.fieldsFor(first)[0]?.name  ?? '';
      this.valueAggEntity = first;
      this.valueAggField  = this.aggFields(first)[0]?.name  ?? '';
      this.emit();
    }
  }

  get entities(): EntityDef[] {
    if (!this.product) return [];
    return this.qsvc.getEntityList(this.product);
  }

  /** All entities reachable from the primary entity via joins. */
  get reachableEntities(): EntityDef[] {
    if (!this.product || !this.primaryEntity) return this.entities;
    return this.qsvc.getReachableEntities(this.product, [this.primaryEntity]);
  }

  /** Reachable entities valid for value aggregation. */
  get valueAggEntities(): EntityDef[] {
    if (this.valueAggFunction === AggregationFunction.Count) return this.reachableEntities;
    return this.reachableEntities.filter(e => this.fieldsFor(e.name).some(f => f.aggregatable));
  }

  fieldsFor(entity: string): FieldDef[] {
    if (!this.product || !entity) return [];
    try { return this.qsvc.getFieldList(this.product, entity); }
    catch { return []; }
  }

  aggFields(entity: string): FieldDef[] {
    const all  = this.fieldsFor(entity);
    const aggr = all.filter(f => f.aggregatable);
    return aggr.length ? aggr : all;
  }
  aggFunctions(): AggregationFunction[]  { return Object.values(AggregationFunction); }

  onPrimaryEntityChange(entity: string): void {
    this.primaryEntity = entity;
    const reachable = this.qsvc.getReachableEntities(this.product, [entity]).map(e => e.name);
    if (this.groupByEntity && !reachable.includes(this.groupByEntity)) {
      this.groupByEntity = entity;
      this.groupByField  = this.fieldsFor(entity)[0]?.name ?? '';
    }
    if (this.valueAggEntity && !reachable.includes(this.valueAggEntity)) {
      this.valueAggEntity = entity;
      this.valueAggField  = this.aggFields(entity)[0]?.name ?? '';
    }
    this.emit();
  }

  onGroupByEntityChange(entity: string): void {
    this.groupByEntity = entity;
    this.groupByField  = this.fieldsFor(entity)[0]?.name ?? '';
    this.emit();
  }

  onValueAggEntityChange(entity: string): void {
    this.valueAggEntity = entity;
    this.valueAggField  = this.aggFields(entity)[0]?.name ?? '';
    this.emit();
  }

  get filterScope(): string[] {
    return [...new Set([
      this.primaryEntity,
      this.groupByEntity,
      this.valueAggEntity,
    ].filter(Boolean))];
  }

  emit(): void {
    const cfg: PieQueryConfig = {
      product:  this.product,
      entities: this.qsvc.buildEntityPath(this.product, [
        this.primaryEntity,
        this.groupByEntity,
        this.valueAggEntity,
      ]),
      groupBy:  { entity: this.groupByEntity, field: this.groupByField },
      valueAgg: { entity: this.valueAggEntity, field: this.valueAggField, function: this.valueAggFunction },
      topN:     this.topNEnabled ? this.topN : undefined,
      filters:  this.filters.length ? this.filters : undefined,
    };
    this.configChange.emit(cfg);
  }
}
