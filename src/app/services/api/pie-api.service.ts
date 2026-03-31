import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Observable }         from 'rxjs';
import { map }                from 'rxjs/operators';

import { environment }        from '../../../environments/environment';
import { PieQueryConfig, PieQueryResult } from '../../core/query-types';

interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

/**
 * PieApiService — posts a `PieQueryConfig` to the backend and returns the
 * typed `PieQueryResult` unwrapped from the API envelope.
 *
 * Endpoint:  POST {apiBaseUrl}/v1/queries/pie
 */
@Injectable({ providedIn: 'root' })
export class PieApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/v1/queries`;

  execute(query: PieQueryConfig): Observable<PieQueryResult> {
    return this.http
      .post<ApiEnvelope<PieQueryResult>>(`${this.base}/pie`, query)
      .pipe(map(res => res.data));
  }
}
