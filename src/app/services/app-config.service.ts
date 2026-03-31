import { Injectable, signal, computed } from '@angular/core';
import { environment }                  from '../../environments/environment';
import { ApiError }                     from '../core/api-error';

/**
 * AppConfigService — runtime configuration and global API state.
 *
 * Responsibilities:
 *  - `useRealApi`  : toggles data source between mock and real API at runtime
 *  - `apiError`    : surfaces the last HTTP error from the error interceptor
 *
 * The `useRealApi` signal is seeded from `environment.useRealApi` so the
 * environment flag is always the default.  In production builds the toggle
 * is intentionally hidden from the UI; the environment flag is the only
 * way to switch.
 */
@Injectable({ providedIn: 'root' })
export class AppConfigService {

  // ── Data-source toggle ────────────────────────────────────────────────────

  private readonly _useRealApi = signal<boolean>(environment.useRealApi);

  /** Read-only public signal — inject AppConfigService and read this. */
  readonly useRealApi = this._useRealApi.asReadonly();

  /** Human-readable label for UI display. */
  readonly dataSourceLabel = computed(() =>
    this._useRealApi() ? 'Live API' : 'Mock data'
  );

  toggleDataSource(): void {
    this._useRealApi.update(v => !v);
  }

  setUseRealApi(value: boolean): void {
    this._useRealApi.set(value);
  }

  // ── Global API error state ────────────────────────────────────────────────

  private readonly _apiError = signal<ApiError | null>(null);

  /** Last API error — set by error interceptor, cleared by dismissal. */
  readonly apiError = this._apiError.asReadonly();

  readonly hasApiError = computed(() => this._apiError() !== null);

  setApiError(err: ApiError): void {
    this._apiError.set(err);
  }

  clearApiError(): void {
    this._apiError.set(null);
  }
}
