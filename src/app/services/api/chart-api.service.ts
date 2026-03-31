import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Observable }         from 'rxjs';
import { map }                from 'rxjs/operators';

import { environment }        from '../../../environments/environment';
import { ChartQueryConfig, ChartQueryResult } from '../../core/query-types';

interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

/**
 * ChartApiService — posts a `ChartQueryConfig` to the backend and returns the
 * typed `ChartQueryResult` unwrapped from the API envelope.
 *
 * Used by both BarWidget and LineWidget.
 *
 * Endpoint:  POST {apiBaseUrl}/v1/queries/chart
 */
@Injectable({ providedIn: 'root' })
export class ChartApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/v1/queries`;

  execute(query: ChartQueryConfig): Observable<ChartQueryResult> {
    return this.http
      .post<ApiEnvelope<ChartQueryResult>>(`${this.base}/chart`, query)
      .pipe(map(res => res.data));
  }
}
