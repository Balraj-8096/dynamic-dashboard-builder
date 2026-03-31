import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Observable }         from 'rxjs';
import { map }                from 'rxjs/operators';

import { environment }        from '../../../environments/environment';
import { EntityDef, FieldDef, GlobalFilterDimension } from '../../core/query-types';
import { ProductMeta }        from '../../core/query-service.interface';

interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

/**
 * SchemaApiService — fetches product/entity/field metadata from the backend.
 *
 * These endpoints mirror the synchronous introspection methods on `QueryService`
 * but resolve over HTTP so the backend can serve up-to-date schema info.
 *
 * Endpoints:
 *   GET {apiBaseUrl}/v1/schema/products
 *   GET {apiBaseUrl}/v1/schema/{product}/entities
 *   GET {apiBaseUrl}/v1/schema/{product}/entities/{entity}/fields
 *   GET {apiBaseUrl}/v1/schema/{product}/global-filters
 *   GET {apiBaseUrl}/v1/schema/{product}/entities/{entity}/fields/{field}/values
 */
@Injectable({ providedIn: 'root' })
export class SchemaApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/v1/schema`;

  getProductList(): Observable<ProductMeta[]> {
    return this.http
      .get<ApiEnvelope<ProductMeta[]>>(`${this.base}/products`)
      .pipe(map(res => res.data));
  }

  getEntityList(product: string): Observable<EntityDef[]> {
    return this.http
      .get<ApiEnvelope<EntityDef[]>>(`${this.base}/${product}/entities`)
      .pipe(map(res => res.data));
  }

  getFieldList(product: string, entity: string): Observable<FieldDef[]> {
    return this.http
      .get<ApiEnvelope<FieldDef[]>>(`${this.base}/${product}/entities/${entity}/fields`)
      .pipe(map(res => res.data));
  }

  getGlobalFilterDimensions(product: string): Observable<GlobalFilterDimension[]> {
    return this.http
      .get<ApiEnvelope<GlobalFilterDimension[]>>(`${this.base}/${product}/global-filters`)
      .pipe(map(res => res.data));
  }

  getDistinctValues(product: string, entity: string, field: string): Observable<string[]> {
    return this.http
      .get<ApiEnvelope<string[]>>(
        `${this.base}/${product}/entities/${entity}/fields/${field}/values`
      )
      .pipe(map(res => res.data));
  }
}
