import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QueryService } from '../../../../services/query.service';
import {
  EntityDef, FieldDef, FilterCondition,
  StatQueryConfig, AggregationFunction, DateInterval, FieldType,
} from '../../../../core/query-types';
import { FilterBuilder } from '../filter-builder/filter-builder';

@Component({
  selector: 'app-stat-query-builder',
  imports: [CommonModule, FormsModule, FilterBuilder],
  templateUrl: './stat-query-builder.html',
  styleUrl: '../../config-panels/config-panels.scss',
})
export class StatQueryBuilder implements OnInit {
  @Input({ required: true }) product!: string;
  @Input() config: StatQueryConfig | null = null;
  @Output() configChange = new EventEmitter<StatQueryConfig>();

  readonly AggregationFunction = AggregationFunction;
  readonly DateInterval = DateInterval;

  readonly periodLabelOptions: { value: string; label: string }[] = [
    { value: '',           label: '— Auto (from active filter) —' },
    { value: 'All time',   label: 'All time'        },
    { value: 'Today',      label: 'Today'           },
    { value: 'Yesterday',  label: 'Yesterday'       },
    { value: 'Last 7 days',  label: 'Last 7 days'   },
    { value: 'Last 30 days', label: 'Last 30 days'  },
    { value: 'Last 90 days', label: 'Last 90 days'  },
    { value: 'This month', label: 'This month'      },
    { value: 'Last month', label: 'Last month'      },
    { value: 'This year',  label: 'This year'       },
    { value: 'Last year',  label: 'Last year'       },
    { value: 'Monthly trend', label: 'Monthly trend'},
    { value: 'Current',    label: 'Current'         },
    { value: '_custom',    label: 'Custom…'         },
  ];

  private readonly qsvc = inject(QueryService);

  primaryEntity  = '';
  aggEntity      = '';
  aggField       = '';
  aggFunction: AggregationFunction = AggregationFunction.Count;
  periodLabel       = '';
  periodLabelPreset = '';   // '' = auto, '_custom' = user-typed, else a preset value
  trendEnabled      = false;
  trendEntity    = '';
  trendField     = '';
  trendInterval: DateInterval = DateInterval.Month;
  trendPeriods   = 1;
  filters: FilterCondition[] = [];

  ngOnInit(): void {
    if (this.config) {
      this.primaryEntity  = this.config.entities[0] ?? '';
      this.aggEntity      = this.config.agg.entity;
      this.aggField       = this.config.agg.field;
      this.aggFunction    = this.config.agg.function;
      this.periodLabel       = this.config.periodLabel ?? '';
      const savedLabel       = this.config.periodLabel ?? '';
      const isKnownPreset    = this.periodLabelOptions.some(
        (o: { value: string; label: string }) => o.value === savedLabel && o.value !== '_custom'
      );
      if (savedLabel === '') {
        this.periodLabelPreset = '';
      } else {
        this.periodLabelPreset = isKnownPreset ? savedLabel : '_custom';
      }
      this.trendEnabled   = !!this.config.trend;
      this.trendEntity    = this.config.trend?.entity ?? '';
      this.trendField     = this.config.trend?.field  ?? '';
      this.trendInterval  = this.config.trend?.interval ?? DateInterval.Month;
      this.trendPeriods   = this.config.trend?.periods  ?? 1;
      this.filters        = [...(this.config.filters ?? [])];
    } else {
      const first = this.entities[0]?.name ?? '';
      this.primaryEntity = first;
      this.aggEntity     = first;
      this.aggField      = this.aggFields(first)[0]?.name ?? '';
      this.trendEntity   = first;
      this.trendField    = this.dateFields(first)[0]?.name ?? '';
      this.emit();
    }
  }

  get entities(): EntityDef[] {
    if (!this.product) return [];
    return this.qsvc.getEntityList(this.product);
  }

  /** Entities reachable by joins from the primary entity. */
  get reachableEntities(): EntityDef[] {
    if (!this.product || !this.primaryEntity) return this.entities;
    return this.qsvc.getReachableEntities(this.product, [this.primaryEntity]);
  }

  /** Entities valid for the Aggregation block.
   *  Count needs no field → all reachable entities shown.
   *  All other functions → only reachable entities that have ≥1 aggregatable field. */
  get aggEntities(): EntityDef[] {
    if (this.aggFunction === AggregationFunction.Count) return this.reachableEntities;
    return this.reachableEntities.filter(e =>
      this.fieldsFor(e.name).some(f => f.aggregatable)
    );
  }

  /** Entities valid for the Trend block (all reachable entities with date fields). */
  get trendEntities(): EntityDef[] {
    return this.reachableEntities.filter(e => this.dateFields(e.name).length > 0);
  }

  fieldsFor(entity: string): FieldDef[] {
    if (!this.product || !entity) return [];
    try { return this.qsvc.getFieldList(this.product, entity); }
    catch { return []; }
  }

  aggFields(entity: string): FieldDef[] {
    const all  = this.fieldsFor(entity);
    const aggr = all.filter(f => f.aggregatable);
    return aggr.length ? aggr : all;   // fallback: show all fields if none marked aggregatable
  }
  dateFields(entity: string): FieldDef[] { return this.fieldsFor(entity).filter(f => f.type === FieldType.Datetime); }
  aggFunctions():  AggregationFunction[] { return Object.values(AggregationFunction); }
  dateIntervals(): DateInterval[]        { return Object.values(DateInterval); }

  onPeriodLabelPresetChange(preset: string): void {
    this.periodLabelPreset = preset;
    if (preset !== '_custom') {
      this.periodLabel = preset;   // '' means auto, anything else is the literal label
      this.emit();
    }
    // '_custom' — wait for the user to type in the text input
  }

  onPrimaryEntityChange(entity: string): void {
    this.primaryEntity = entity;
    // Reset dependent entities if they're no longer reachable
    const reachable = this.qsvc.getReachableEntities(this.product, [entity]).map(e => e.name);
    if (this.aggEntity && !reachable.includes(this.aggEntity)) {
      this.aggEntity = entity;
      this.aggField  = this.aggFunction !== AggregationFunction.Count
        ? (this.aggFields(entity)[0]?.name ?? '') : '';
    }
    if (this.trendEntity && !reachable.includes(this.trendEntity)) {
      this.trendEntity = entity;
      this.trendField  = this.dateFields(entity)[0]?.name ?? '';
    }
    this.emit();
  }

  onAggEntityChange(entity: string): void {
    this.aggEntity = entity;
    // Reset field to first available; for Count the field is unused
    this.aggField  = this.aggFunction !== AggregationFunction.Count
      ? (this.aggFields(entity)[0]?.name ?? '')
      : '';
    this.emit();
  }

  onTrendEntityChange(entity: string): void {
    this.trendEntity = entity;
    this.trendField  = this.dateFields(entity)[0]?.name ?? '';
    this.emit();
  }

  /** Entities currently in scope for this query (used by filter builder). */
  get filterScope(): string[] {
    return [...new Set([
      this.primaryEntity,
      this.aggEntity,
      ...(this.trendEnabled && this.trendEntity ? [this.trendEntity] : []),
    ].filter(Boolean))];
  }

  emit(): void {
    const cfg: StatQueryConfig = {
      product:  this.product,
      entities: this.qsvc.buildEntityPath(this.product, [
        this.primaryEntity,
        this.aggEntity,
        ...(this.trendEnabled && this.trendEntity ? [this.trendEntity] : []),
      ]),
      agg: {
        entity:   this.aggEntity,
        field:    this.aggField,
        function: this.aggFunction,
      },
      periodLabel: this.periodLabel || undefined,
      filters: this.filters.length ? this.filters : undefined,
      trend: this.trendEnabled && this.trendEntity && this.trendField ? {
        entity:   this.trendEntity,
        field:    this.trendField,
        interval: this.trendInterval,
        periods:  this.trendPeriods,
      } : undefined,
    };
    this.configChange.emit(cfg);
  }
}
