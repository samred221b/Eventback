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

  console.log('[Analytics] getNativeAnalytics() called, using native Firebase Analytics');

  analyticsModulePromise = (async () => {
    try {
      // Web Analytics SDK relies on DOM; avoid it on native.
      if (Platform.OS === 'web') return null;

      const isExpoGo = Constants.executionEnvironment === 'storeClient' ||
        Constants.appOwnership === 'expo';
      if (isExpoGo) return null;

      const appMod = await import('@react-native-firebase/app');
      try {
        if (!appMod.firebase.apps?.length) {
          appMod.initializeApp();
        }
        console.log('[Firebase] Native default app ready (from analytics):', appMod.firebase.app().options?.appId);
      } catch (e) {
        console.log('[Firebase] Native app init failed (from analytics):', e?.message);
        return null;
      }

      console.log('[Analytics] Importing @react-native-firebase/analytics');
      const mod = await import('@react-native-firebase/analytics');
      const analytics = mod.default;

      if (typeof analytics !== 'function') return null;
      const instance = analytics();

      await instance.setAnalyticsCollectionEnabled(true);
      console.log('[Analytics] Firebase Analytics initialized successfully');
      return instance;
    } catch (e) {
      console.log('[Analytics] Analytics module not available:', e.message);
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
