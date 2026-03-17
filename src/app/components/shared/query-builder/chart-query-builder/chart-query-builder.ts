import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QueryService } from '../../../../services/query.service';
import {
  EntityDef, FieldDef, FilterCondition,
  ChartQueryConfig, AggregationFunction, DateInterval, FieldType,
} from '../../../../core/query-types';
import { FilterBuilder } from '../filter-builder/filter-builder';

@Component({
  selector: 'app-chart-query-builder',
  imports: [CommonModule, FormsModule, FilterBuilder],
  templateUrl: './chart-query-builder.html',
  styleUrl: '../../config-panels/config-panels.scss',
})
export class ChartQueryBuilder implements OnInit {
  @Input({ required: true }) product!: string;
  @Input() config: ChartQueryConfig | null = null;
  @Output() configChange = new EventEmitter<ChartQueryConfig>();

  readonly AggregationFunction = AggregationFunction;
  readonly DateInterval = DateInterval;

  private readonly qsvc = inject(QueryService);

  primaryEntity      = '';
  dateAxisEntity     = '';
  dateAxisField      = '';
  dateAxisInterval: DateInterval = DateInterval.Month;
  valueAggEntity     = '';
  valueAggField      = '';
  valueAggFunction: AggregationFunction = AggregationFunction.Count;
  groupByEnabled     = false;
  groupByEntity      = '';
  groupByField       = '';
  filters: FilterCondition[] = [];

  ngOnInit(): void {
    if (this.config) {
      this.primaryEntity      = this.config.entities[0]          ?? '';
      this.dateAxisEntity     = this.config.dateAxis?.entity     ?? this.config.entities[0] ?? '';
      this.dateAxisField      = this.config.dateAxis?.field      ?? '';
      this.dateAxisInterval   = this.config.dateAxis?.interval   ?? DateInterval.Month;
      this.valueAggEntity     = this.config.valueAgg.entity;
      this.valueAggField      = this.config.valueAgg.field;
      this.valueAggFunction   = this.config.valueAgg.function;
      this.groupByEnabled     = !!this.config.groupBy;
      this.groupByEntity      = this.config.groupBy?.entity   ?? '';
      this.groupByField       = this.config.groupBy?.field    ?? '';
      this.filters            = [...(this.config.filters ?? [])];
    } else {
      const first = this.entities[0]?.name ?? '';
      this.primaryEntity    = first;
      this.dateAxisEntity   = first;
      this.dateAxisField    = this.dateFields(first)[0]?.name ?? '';
      this.valueAggEntity   = first;
      this.valueAggField    = this.aggFields(first)[0]?.name  ?? '';
      this.groupByEntity    = first;
      this.groupByField     = this.fieldsFor(first)[0]?.name  ?? '';
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

  /** Reachable entities valid for value aggregation (need a numeric field, or all when Count). */
  get valueAggEntities(): EntityDef[] {
    if (this.valueAggFunction === AggregationFunction.Count) return this.reachableEntities;
    return this.reachableEntities.filter(e => this.fieldsFor(e.name).some(f => f.aggregatable));
  }

  fieldsFor(entity: string): FieldDef[] {
    if (!this.product || !entity) return [];
    try { return this.qsvc.getFieldList(this.product, entity); }
    catch { return []; }
  }

  dateFields(entity: string): FieldDef[] { return this.fieldsFor(entity).filter(f => f.type === FieldType.Datetime); }
  aggFields(entity: string):  FieldDef[] {
    const all  = this.fieldsFor(entity);
    const aggr = all.filter(f => f.aggregatable);
    return aggr.length ? aggr : all;
  }
  dateIntervals():  DateInterval[]        { return Object.values(DateInterval); }
  aggFunctions(): AggregationFunction[]   { return Object.values(AggregationFunction); }

  onPrimaryEntityChange(entity: string): void {
    this.primaryEntity = entity;
    const reachable = new Set(this.qsvc.getReachableEntities(this.product, [entity]).map(e => e.name));
    if (this.dateAxisEntity && !reachable.has(this.dateAxisEntity)) {
      this.dateAxisEntity = entity;
      this.dateAxisField  = this.dateFields(entity)[0]?.name ?? '';
    }
    if (this.valueAggEntity && !reachable.has(this.valueAggEntity)) {
      this.valueAggEntity = entity;
      this.valueAggField  = this.aggFields(entity)[0]?.name ?? '';
    }
    if (this.groupByEnabled && this.groupByEntity && !reachable.has(this.groupByEntity)) {
      this.groupByEntity = entity;
      this.groupByField  = this.fieldsFor(entity)[0]?.name ?? '';
    }
    this.emit();
  }

  onDateAxisEntityChange(entity: string): void {
    this.dateAxisEntity = entity;
    this.dateAxisField  = this.dateFields(entity)[0]?.name ?? '';
    this.emit();
  }

  onValueAggEntityChange(entity: string): void {
    this.valueAggEntity = entity;
    this.valueAggField  = this.aggFields(entity)[0]?.name ?? '';
    this.emit();
  }

  onGroupByEntityChange(entity: string): void {
    this.groupByEntity = entity;
    this.groupByField  = this.fieldsFor(entity)[0]?.name ?? '';
    this.emit();
  }

  get filterScope(): string[] {
    return [...new Set([
      this.primaryEntity,
      this.dateAxisEntity,
      this.valueAggEntity,
      ...(this.groupByEnabled && this.groupByEntity ? [this.groupByEntity] : []),
    ].filter(Boolean))];
  }

  emit(): void {
    const cfg: ChartQueryConfig = {
      product:  this.product,
      entities: this.qsvc.buildEntityPath(this.product, [
        this.primaryEntity,
        this.dateAxisEntity,
        this.valueAggEntity,
        ...(this.groupByEnabled && this.groupByEntity ? [this.groupByEntity] : []),
      ]),
      dateAxis: {
        entity:   this.dateAxisEntity,
        field:    this.dateAxisField,
        interval: this.dateAxisInterval,
      },
      valueAgg: {
        entity:   this.valueAggEntity,
        field:    this.valueAggField,
        function: this.valueAggFunction,
      },
      groupBy: this.groupByEnabled && this.groupByEntity && this.groupByField
        ? { entity: this.groupByEntity, field: this.groupByField }
        : undefined,
      filters: this.filters.length ? this.filters : undefined,
    };
    this.configChange.emit(cfg);
  }
}
