import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Observable }         from 'rxjs';
import { map }                from 'rxjs/operators';

import { environment }        from '../../../environments/environment';
import { StatQueryConfig, StatQueryResult } from '../../core/query-types';

/** Envelope shape returned by the backend for all query endpoints. */
interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

/**
 * StatApiService — posts a `StatQueryConfig` to the backend and returns the
 * typed `StatQueryResult` unwrapped from the API envelope.
 *
 * Endpoint:  POST {apiBaseUrl}/v1/queries/stat
 */
@Injectable({ providedIn: 'root' })
export class StatApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/v1/queries`;

  execute(query: StatQueryConfig): Observable<StatQueryResult> {
    return this.http
      .post<ApiEnvelope<StatQueryResult>>(`${this.base}/stat`, query)
      .pipe(map(res => res.data));
  }
}
