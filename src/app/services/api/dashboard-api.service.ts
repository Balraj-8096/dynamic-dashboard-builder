import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Observable }         from 'rxjs';
import { map }                from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { Widget }      from '../../core/interfaces';

// ── Payload shapes ────────────────────────────────────────────────────────────

/** Full dashboard record as returned by the backend. */
export interface DashboardPayload {
  id:        string;
  title:     string;
  widgets:   Widget[];
  updatedAt?: string;
}

/** Minimal summary used for list responses. */
export interface DashboardSummary {
  id:        string;
  title:     string;
  updatedAt?: string;
}

interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

// ── Service ───────────────────────────────────────────────────────────────────

/**
 * DashboardApiService — REST CRUD for dashboard records.
 *
 * Endpoints (relative to `environment.apiBaseUrl/v1`):
 *   GET    /dashboards              → list all dashboards (summaries)
 *   GET    /dashboards/{id}         → fetch one full dashboard
 *   POST   /dashboards              → create a new dashboard, returns record with server-assigned id
 *   PUT    /dashboards/{id}         → update title + widgets (full replace)
 *   DELETE /dashboards/{id}         → delete a dashboard
 */
@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/v1/dashboards`;

  /** List all dashboards belonging to the authenticated user. */
  list(): Observable<DashboardSummary[]> {
    return this.http
      .get<ApiEnvelope<DashboardSummary[]>>(this.base)
      .pipe(map(res => res.data));
  }

  /** Fetch a single dashboard by ID (includes full widget array). */
  get(id: string): Observable<DashboardPayload> {
    return this.http
      .get<ApiEnvelope<DashboardPayload>>(`${this.base}/${id}`)
      .pipe(map(res => res.data));
  }

  /**
   * Create a new dashboard on the server.
   * The server assigns the canonical `id`; the client may supply a client-generated
   * UUID which the server can accept or replace with its own.
   */
  create(payload: Omit<DashboardPayload, 'updatedAt'>): Observable<DashboardPayload> {
    return this.http
      .post<ApiEnvelope<DashboardPayload>>(this.base, payload)
      .pipe(map(res => res.data));
  }

  /**
   * Persist the full dashboard state (title + widgets) to the server.
   * A `PUT` performs a full replace — all current widget state is sent.
   */
  save(id: string, payload: Omit<DashboardPayload, 'id' | 'updatedAt'>): Observable<DashboardPayload> {
    return this.http
      .put<ApiEnvelope<DashboardPayload>>(`${this.base}/${id}`, payload)
      .pipe(map(res => res.data));
  }

  /** Permanently delete a dashboard. */
  delete(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.base}/${id}`);
  }
}
