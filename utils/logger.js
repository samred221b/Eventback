// Centralized logger that no-ops in production
export const logger = {
  log: (...args) => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  },
  warn: (...args) => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(...args);
    }
  },
  error: (...args) => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error(...args);
    }
  },
};
