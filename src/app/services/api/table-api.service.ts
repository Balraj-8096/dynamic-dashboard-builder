import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Observable }         from 'rxjs';
import { map }                from 'rxjs/operators';

import { environment }        from '../../../environments/environment';
import { TableQueryConfig, TableQueryResult } from '../../core/query-types';

interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

/**
 * TableApiService — posts a `TableQueryConfig` to the backend and returns the
 * typed `TableQueryResult` unwrapped from the API envelope.
 *
 * Pagination (`page`, `pageSize`) is part of the config so the backend handles
 * it server-side; the response includes `totalRows` for client-side pagination UI.
 *
 * Endpoint:  POST {apiBaseUrl}/v1/queries/table
 */
@Injectable({ providedIn: 'root' })
export class TableApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/v1/queries`;

  execute(query: TableQueryConfig): Observable<TableQueryResult> {
    return this.http
      .post<ApiEnvelope<TableQueryResult>>(`${this.base}/table`, query)
      .pipe(map(res => res.data));
  }
}
