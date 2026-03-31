import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject }                                from '@angular/core';
import { catchError, throwError }                from 'rxjs';

import { AppConfigService }                      from '../../services/app-config.service';
import { ApiError, API_ERROR_CODES }             from '../api-error';

/**
 * Error interceptor — maps HTTP error responses into a typed `ApiError`
 * and forwards it to `AppConfigService.apiError` signal so any component
 * can react without coupling directly to HTTP.
 *
 * Handled cases:
 *   401 → UNAUTHORIZED  (token missing / expired)
 *   403 → FORBIDDEN     (insufficient permissions)
 *   404 → NOT_FOUND
 *   5xx → SERVER_ERROR
 *   0   → NETWORK_ERROR (no connection / CORS / timeout)
 *   *   → UNKNOWN
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const configSvc = inject(AppConfigService);

  return next(req).pipe(
    catchError((err: unknown) => {
      const apiError = buildApiError(err);
      configSvc.setApiError(apiError);
      return throwError(() => apiError);
    }),
  );
};

// ── helpers ──────────────────────────────────────────────────────────────────

function buildApiError(err: unknown): ApiError {
  if (err instanceof HttpErrorResponse) {
    return {
      status:  err.status,
      code:    resolveCode(err.status),
      message: extractMessage(err),
      url:     err.url,
    };
  }

  // Non-HTTP error (e.g. thrown inside an RxJS pipe)
  return {
    status:  0,
    code:    API_ERROR_CODES.UNKNOWN,
    message: err instanceof Error ? err.message : 'An unexpected error occurred.',
    url:     null,
  };
}

function resolveCode(status: number): string {
  if (status === 401) return API_ERROR_CODES.UNAUTHORIZED;
  if (status === 403) return API_ERROR_CODES.FORBIDDEN;
  if (status === 404) return API_ERROR_CODES.NOT_FOUND;
  if (status >= 500)  return API_ERROR_CODES.SERVER_ERROR;
  if (status === 0)   return API_ERROR_CODES.NETWORK_ERROR;
  return API_ERROR_CODES.UNKNOWN;
}

function extractMessage(err: HttpErrorResponse): string {
  // Try to read a message from the response body first
  const body = err.error;
  if (body && typeof body === 'object') {
    const typed = body as Record<string, unknown>;
    if (typeof typed['message'] === 'string') return typed['message'];
    if (typeof typed['error']   === 'string') return typed['error'];
  }
  return err.message || `HTTP ${err.status}`;
}
