/** Structured API error emitted by the error interceptor. */
export interface ApiError {
  status:  number;
  code:    string;
  message: string;
  /** Raw HTTP URL that triggered the error. */
  url:     string | null;
}

/** Well-known error codes used internally. */
export const API_ERROR_CODES = {
  UNAUTHORIZED:    'UNAUTHORIZED',
  FORBIDDEN:       'FORBIDDEN',
  NOT_FOUND:       'NOT_FOUND',
  SERVER_ERROR:    'SERVER_ERROR',
  NETWORK_ERROR:   'NETWORK_ERROR',
  UNKNOWN:         'UNKNOWN',
} as const;
