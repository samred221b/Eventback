import { Platform } from 'react-native';
import Constants from 'expo-constants';

import { logger } from '../utils/logger';

const getExtra = () => {
  const expoConfig = Constants.expoConfig || Constants.manifest;
  return expoConfig?.extra || {};
};

const isEnabled = () => {
  // Force enable for debugging
  console.log('[Analytics] isEnabled() called, returning true');
  return true;
};

const safeString = (value) => {
  if (value === null || value === undefined) return undefined;
  return String(value);
};

const safeParams = (params) => {
  if (!params || typeof params !== 'object') return undefined;

  const out = {};
  Object.keys(params).forEach((k) => {
    const v = params[k];
    if (v === undefined) return;
    if (v === null) return;

    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      out[k] = v;
      return;
    }

    out[k] = safeString(v);
  });

  return out;
};

let analyticsModulePromise = null;

const getNativeAnalytics = async () => {
  if (analyticsModulePromise) return analyticsModulePromise;

  console.log('[Analytics] getNativeAnalytics() called, using Firebase Web SDK fallback');

  analyticsModulePromise = (async () => {
    try {
      // Use Firebase Web SDK as fallback since native SDK isn't working
      console.log('[Analytics] Importing Firebase Web SDK');
      const { getAnalytics, logEvent: webLogEvent, setUserId: webSetUserId, setUserProperties: webSetUserProperties } = await import('firebase/analytics');
      const { getApp } = await import('firebase/app');
      
      const app = getApp();
      const analytics = getAnalytics(app);
      
      console.log('[Analytics] Firebase Web Analytics initialized successfully');
      
      return {
        logEvent: (name, params) => {
          console.log('[Analytics] Web SDK logEvent:', name, params);
          return webLogEvent(analytics, name, { ...(params || {}), debug_mode: 1 });
        },
        logScreenView: ({ screen_name, screen_class }) => {
          console.log('[Analytics] Web SDK logScreenView:', screen_name, screen_class);
          const firebase_screen = typeof screen_name === 'string' ? screen_name : undefined;
          const firebase_screen_class = typeof screen_class === 'string' ? screen_class : firebase_screen;
          if (!firebase_screen) return;
          return webLogEvent(analytics, 'screen_view', {
            firebase_screen,
            firebase_screen_class,
            debug_mode: 1,
          });
        },
        setUserId: (id) => {
          console.log('[Analytics] Web SDK setUserId:', id);
          return webSetUserId(analytics, id);
        },
        setUserProperties: (properties) => {
          console.log('[Analytics] Web SDK setUserProperties:', properties);
          return webSetUserProperties(analytics, properties);
        }
      };
    } catch (e) {
      console.log('[Analytics] Web SDK not available:', e.message);
      logger.warn('Analytics module not available:', e.message);
      return null;
    }
  })();

  return analyticsModulePromise;
};

const analyticsService = {
  isEnabled,

  async logEvent(name, params) {
    if (!isEnabled()) return;

    try {
      if (Platform.OS === 'web') {
        return;
      }

      const native = await getNativeAnalytics();
      if (!native) return;

      await native.logEvent(name, safeParams(params));
    } catch (e) {
      logger.warn('analytics logEvent failed', e);
    }
  },

  async logScreenView(screenName, screenClassOverride) {
    if (!isEnabled()) return;

    try {
      if (Platform.OS === 'web') {
        return;
      }

      const native = await getNativeAnalytics();
      if (!native) return;

      const name = safeString(screenName);
      if (!name) return;

      await native.logScreenView({
        screen_name: name,
        screen_class: safeString(screenClassOverride) || name,
      });
    } catch (e) {
      logger.warn('analytics logScreenView failed', e);
    }
  },

  async setUserId(userId) {
    if (!isEnabled()) return;

    try {
      if (Platform.OS === 'web') {
        return;
      }

      const native = await getNativeAnalytics();
      if (!native) return;

      await native.setUserId(safeString(userId) || null);
    } catch (e) {
      logger.warn('analytics setUserId failed', e);
    }
  },

  async setUserProperties(props) {
    if (!isEnabled()) return;

    try {
      if (Platform.OS === 'web') {
        return;
      }

      const native = await getNativeAnalytics();
      if (!native) return;

      await native.setUserProperties(safeParams(props));
    } catch (e) {
      logger.warn('analytics setUserProperties failed', e);
    }
  },
};

export default analyticsService;
