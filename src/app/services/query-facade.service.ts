import { Injectable, inject, Signal } from '@angular/core';
import { Observable } from 'rxjs';

import { AppConfigService }            from './app-config.service';
import { MockQueryAdapter }            from './mock-query.adapter';
import {
  StatApiService,
  ChartApiService,
  PieApiService,
  TableApiService,
  SchemaApiService,
} from './api';
import { IQueryService, ProductMeta }  from '../core/query-service.interface';
import {
  StatQueryConfig,   StatQueryResult,
  ChartQueryConfig,  ChartQueryResult,
  PieQueryConfig,    PieQueryResult,
  TableQueryConfig,  TableQueryResult,
  FilterCondition,
  EntityDef, FieldDef, GlobalFilterDimension,
} from '../core/query-types';

/**
 * QueryServiceFacade — the single implementation registered behind
 * `QUERY_SERVICE_TOKEN`.  It reads `AppConfigService.useRealApi()` on every
 * call so that flipping the toggle in the sidebar takes effect immediately,
 * without requiring a page reload or re-injection.
 *
 * When `useRealApi()` is false  → delegates to `MockQueryAdapter`
 * When `useRealApi()` is true   → delegates to the dedicated API services
 *
 * Global filters always delegate to `MockQueryAdapter` (which owns the
 * signal) so the signal reference is stable regardless of the active mode.
 */
@Injectable({ providedIn: 'root' })
export class QueryServiceFacade implements IQueryService {

  private readonly config    = inject(AppConfigService);
  private readonly mock      = inject(MockQueryAdapter);
  private readonly statApi   = inject(StatApiService);
  private readonly chartApi  = inject(ChartApiService);
  private readonly pieApi    = inject(PieApiService);
  private readonly tableApi  = inject(TableApiService);
  private readonly schemaApi = inject(SchemaApiService);

  // ── Global filters — always backed by the mock adapter's signal ───────────
  // The signal is stable and shared; both modes apply global filters the same way.

  get globalFilters(): Signal<FilterCondition[]> {
    return this.mock.globalFilters;
  }

  setGlobalFilters(filters: FilterCondition[]): void {
    this.mock.setGlobalFilters(filters);
  }

  clearGlobalFilters(): void {
    this.mock.clearGlobalFilters();
  }

  // ── Execute methods ───────────────────────────────────────────────────────

  executeStatQuery(query: StatQueryConfig): Observable<StatQueryResult> {
    return this.config.useRealApi()
      ? this.statApi.execute(query)
      : this.mock.executeStatQuery(query);
  }

  executeChartQuery(query: ChartQueryConfig): Observable<ChartQueryResult> {
    return this.config.useRealApi()
      ? this.chartApi.execute(query)
      : this.mock.executeChartQuery(query);
  }

  executePieQuery(query: PieQueryConfig): Observable<PieQueryResult> {
    return this.config.useRealApi()
      ? this.pieApi.execute(query)
      : this.mock.executePieQuery(query);
  }

  executeTableQuery(query: TableQueryConfig): Observable<TableQueryResult> {
    return this.config.useRealApi()
      ? this.tableApi.execute(query)
      : this.mock.executeTableQuery(query);
  }

  // ── Schema introspection ──────────────────────────────────────────────────

  getProductList(): Observable<ProductMeta[]> {
    return this.config.useRealApi()
      ? this.schemaApi.getProductList()
      : this.mock.getProductList();
  }

  getEntityList(product: string): Observable<EntityDef[]> {
    return this.config.useRealApi()
      ? this.schemaApi.getEntityList(product)
      : this.mock.getEntityList(product);
  }

  getFieldList(product: string, entity: string): Observable<FieldDef[]> {
    return this.config.useRealApi()
      ? this.schemaApi.getFieldList(product, entity)
      : this.mock.getFieldList(product, entity);
  }

  getGlobalFilterDimensions(product: string): Observable<GlobalFilterDimension[]> {
    return this.config.useRealApi()
      ? this.schemaApi.getGlobalFilterDimensions(product)
      : this.mock.getGlobalFilterDimensions(product);
  }

  getDistinctValues(product: string, entity: string, field: string): Observable<string[]> {
    return this.config.useRealApi()
      ? this.schemaApi.getDistinctValues(product, entity, field)
      : this.mock.getDistinctValues(product, entity, field);
  }
}
