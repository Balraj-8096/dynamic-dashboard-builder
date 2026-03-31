import { Injectable, inject } from '@angular/core';
import { Observable, of }     from 'rxjs';

import { QueryService }       from './query.service';
import { IQueryService, ProductMeta } from '../core/query-service.interface';
import {
  StatQueryConfig,   StatQueryResult,
  ChartQueryConfig,  ChartQueryResult,
  PieQueryConfig,    PieQueryResult,
  TableQueryConfig,  TableQueryResult,
  FilterCondition,
  EntityDef, FieldDef, GlobalFilterDimension,
} from '../core/query-types';

/**
 * MockQueryAdapter — wraps the existing synchronous `QueryService` so it
 * satisfies the async `IQueryService` contract.
 *
 * Every method calls the underlying sync service and wraps the result in
 * `of(...)` to produce an `Observable<T>`.  This keeps widget components
 * identical whether they are talking to mock data or the real API.
 *
 * This adapter is used when `AppConfigService.useRealApi()` is `false`.
 */
@Injectable({ providedIn: 'root' })
export class MockQueryAdapter implements IQueryService {

  private readonly svc = inject(QueryService);

  // ── Global filters (delegate directly to the underlying signal) ───────────

  get globalFilters() { return this.svc.globalFilters; }

  setGlobalFilters(filters: FilterCondition[]): void {
    this.svc.setGlobalFilters(filters);
  }

  clearGlobalFilters(): void {
    this.svc.clearGlobalFilters();
  }

  // ── Execute methods ───────────────────────────────────────────────────────

  executeStatQuery(query: StatQueryConfig): Observable<StatQueryResult> {
    return of(this.svc.executeStatQuery(query));
  }

  executeChartQuery(query: ChartQueryConfig): Observable<ChartQueryResult> {
    return of(this.svc.executeChartQuery(query));
  }

  executePieQuery(query: PieQueryConfig): Observable<PieQueryResult> {
    return of(this.svc.executePieQuery(query));
  }

  executeTableQuery(query: TableQueryConfig): Observable<TableQueryResult> {
    return of(this.svc.executeTableQuery(query));
  }

  // ── Schema introspection ──────────────────────────────────────────────────

  getProductList(): Observable<ProductMeta[]> {
    const list = this.svc.getProductList();
    return of(list.map(p => ({ slug: p.slug, display_name: p.display_name })));
  }

  getEntityList(product: string): Observable<EntityDef[]> {
    return of(this.svc.getEntityList(product));
  }

  getFieldList(product: string, entity: string): Observable<FieldDef[]> {
    return of(this.svc.getFieldList(product, entity));
  }

  getGlobalFilterDimensions(product: string): Observable<GlobalFilterDimension[]> {
    return of(this.svc.getGlobalFilterDimensions(product));
  }

  getDistinctValues(product: string, entity: string, field: string): Observable<string[]> {
    return of(this.svc.getDistinctValues(product, entity, field));
  }
}
