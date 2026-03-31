import { HttpInterceptorFn } from '@angular/common/http';
import { environment }       from '../../../environments/environment';

/**
 * Auth interceptor — attaches `Authorization: Bearer <token>` to every
 * outbound request when a token is present in localStorage.
 *
 * Token key is configurable via environment.authTokenKey so it can differ
 * between dev and production without code changes.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(environment.authTokenKey);

  if (!token) {
    return next(req);
  }

  const authedReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });

  return next(authedReq);
};
