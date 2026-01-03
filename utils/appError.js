export const APP_ERROR_KIND = {
  OFFLINE: 'offline',
  NETWORK: 'network',
  TIMEOUT: 'timeout',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  SERVER: 'server',
  VALIDATION: 'validation',
  UNKNOWN: 'unknown',
};

export const APP_ERROR_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success',
};

export const createAppError = ({
  kind = APP_ERROR_KIND.UNKNOWN,
  severity = APP_ERROR_SEVERITY.ERROR,
  userMessage = 'Something went wrong',
  details = null,
  retryable = true,
  statusCode = null,
} = {}) => ({
  kind,
  severity,
  userMessage,
  details,
  retryable,
  statusCode,
});

export const toAppError = (err, { fallbackMessage } = {}) => {
  if (!err) {
    return createAppError({
      kind: APP_ERROR_KIND.UNKNOWN,
      severity: APP_ERROR_SEVERITY.ERROR,
      userMessage: fallbackMessage || 'Something went wrong',
      retryable: true,
    });
  }

  if (typeof err === 'string') {
    return createAppError({
      kind: APP_ERROR_KIND.UNKNOWN,
      severity: APP_ERROR_SEVERITY.ERROR,
      userMessage: err,
      retryable: true,
    });
  }

  const message = String(err?.message || fallbackMessage || 'Something went wrong');
  const messageLower = message.toLowerCase();
  const statusCode = typeof err?.status === 'number' ? err.status : (typeof err?.statusCode === 'number' ? err.statusCode : null);

  const isTimeout = err?.name === 'AbortError' || err?.code === 'request/timeout' || messageLower.includes('timeout');
  if (isTimeout) {
    return createAppError({
      kind: APP_ERROR_KIND.TIMEOUT,
      severity: APP_ERROR_SEVERITY.ERROR,
      userMessage: 'Request Timeout',
      details: 'The server is taking too long to respond. Please try again.',
      retryable: true,
      statusCode,
    });
  }

  const isNetwork = messageLower.includes('network request failed') || messageLower.includes('failed to fetch');
  if (isNetwork) {
    return createAppError({
      kind: APP_ERROR_KIND.NETWORK,
      severity: APP_ERROR_SEVERITY.ERROR,
      userMessage: 'Network Error',
      details: 'Unable to connect to the server. Please check your connection.',
      retryable: true,
      statusCode,
    });
  }

  if (statusCode === 401 || err?.code === 'auth/no-token') {
    return createAppError({
      kind: APP_ERROR_KIND.UNAUTHORIZED,
      severity: APP_ERROR_SEVERITY.ERROR,
      userMessage: 'Authentication Required',
      details: 'Please sign in again to continue.',
      retryable: false,
      statusCode,
    });
  }

  if (statusCode === 403) {
    return createAppError({
      kind: APP_ERROR_KIND.FORBIDDEN,
      severity: APP_ERROR_SEVERITY.ERROR,
      userMessage: 'Access Denied',
      details: 'You do not have permission to perform this action.',
      retryable: false,
      statusCode,
    });
  }

  if (statusCode && statusCode >= 500) {
    return createAppError({
      kind: APP_ERROR_KIND.SERVER,
      severity: APP_ERROR_SEVERITY.ERROR,
      userMessage: 'Server Error',
      details: message,
      retryable: true,
      statusCode,
    });
  }

  return createAppError({
    kind: APP_ERROR_KIND.UNKNOWN,
    severity: APP_ERROR_SEVERITY.ERROR,
    userMessage: message,
    retryable: true,
    statusCode,
  });
};

export const createOfflineCachedNotice = (details) =>
  createAppError({
    kind: APP_ERROR_KIND.OFFLINE,
    severity: APP_ERROR_SEVERITY.WARNING,
    userMessage: 'Offline: Showing cached data',
    details: details || 'Some information may be outdated.',
    retryable: true,
  });
