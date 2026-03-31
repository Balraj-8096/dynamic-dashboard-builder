import { InjectionToken, Signal } from '@angular/core';
import { Observable }             from 'rxjs';

import {
  StatQueryConfig,   StatQueryResult,
  ChartQueryConfig,  ChartQueryResult,
  PieQueryConfig,    PieQueryResult,
  TableQueryConfig,  TableQueryResult,
  FilterCondition,
  EntityDef, FieldDef, GlobalFilterDimension,
} from './query-types';

// ── Lightweight schema meta returned by the interface ────────────────────────

export interface ProductMeta {
  slug:         string;
  display_name: string;
}

// ── Service contract ─────────────────────────────────────────────────────────

/**
 * IQueryService — the single contract that all data-consuming components
 * program against.
 *
 * Both `MockQueryAdapter` (wraps the existing sync `QueryService`) and
 * `ApiQueryService` (calls `http://localhost:8080`) implement this interface.
 * `QueryServiceFacade` delegates to whichever implementation is active.
 *
 * All execute methods return `Observable<T>` so components are uniform
 * regardless of whether the data comes from memory or the network.
 *
 * Schema-introspection methods (`getProductList`, `getEntityList`, etc.) also
 * return Observables so that future backends can serve these dynamically.
 */
export interface IQueryService {

  // ── Execute methods ───────────────────────────────────────────────────────

  executeStatQuery(query: StatQueryConfig):   Observable<StatQueryResult>;
  executeChartQuery(query: ChartQueryConfig): Observable<ChartQueryResult>;
  executePieQuery(query: PieQueryConfig):     Observable<PieQueryResult>;
  executeTableQuery(query: TableQueryConfig): Observable<TableQueryResult>;

  // ── Schema introspection ──────────────────────────────────────────────────

  getProductList():                                           Observable<ProductMeta[]>;
  getEntityList(product: string):                             Observable<EntityDef[]>;
  getFieldList(product: string, entity: string):              Observable<FieldDef[]>;
  getGlobalFilterDimensions(product: string):                 Observable<GlobalFilterDimension[]>;
  getDistinctValues(product: string, entity: string, field: string): Observable<string[]>;

  // ── Global filters (dashboard-level, reactive signal) ────────────────────

  readonly globalFilters: Signal<FilterCondition[]>;
  setGlobalFilters(filters: FilterCondition[]): void;
  clearGlobalFilters(): void;
}

// ── Injection token ───────────────────────────────────────────────────────────

/**
 * Use `inject(QUERY_SERVICE_TOKEN)` in every component that needs query
 * execution or schema introspection.  Never inject `QueryService` directly —
 * the token ensures the mock/API switch is transparent.
 */
export const QUERY_SERVICE_TOKEN = new InjectionToken<IQueryService>(
  'IQueryService',
);
