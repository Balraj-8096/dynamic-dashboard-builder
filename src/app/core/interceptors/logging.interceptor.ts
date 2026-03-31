import { HttpInterceptorFn } from '@angular/common/http';
import { tap }               from 'rxjs/operators';
import { environment }       from '../../../environments/environment';

/**
 * Logging interceptor — prints request/response details to the console.
 * Active in development builds only (`environment.production === false`).
 *
 * Output format:
 *   [HTTP] → GET  /v1/queries/stat
 *   [HTTP] ← 200  GET  /v1/queries/stat  (143ms)
 *   [HTTP] ✗ 500  GET  /v1/queries/stat  (55ms)
 */
export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  if (environment.production) {
    return next(req);
  }

  const started = Date.now();
  const label   = `${req.method.padEnd(6)} ${req.urlWithParams}`;

  console.debug(`[HTTP] →  ${label}`);

  return next(req).pipe(
    tap({
      next: event => {
        // HttpResponse carries status; intermediate events (e.g. Upload) do not
        if ('status' in event) {
          const ms = Date.now() - started;
          console.debug(`[HTTP] ←  ${(event as { status: number }).status}  ${label}  (${ms}ms)`);
        }
      },
      error: (err: unknown) => {
        const ms     = Date.now() - started;
        const status = (err as { status?: number }).status ?? 0;
        console.warn(`[HTTP] ✗  ${status}  ${label}  (${ms}ms)`, err);
      },
    }),
  );
};
