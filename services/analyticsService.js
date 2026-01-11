import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { logger } from '../utils/logger';
import * as Amplitude from '@amplitude/analytics-react-native';

const getExtra = () => {
  const expoConfig = Constants.expoConfig || Constants.manifest;
  return expoConfig?.extra || {};
};

const isEnabled = () => {
  const extra = getExtra();
  if (typeof extra.analyticsEnabled === 'boolean') return extra.analyticsEnabled;
  return !__DEV__;
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

let amplitudeInitPromise = null;

const ensureAmplitude = async () => {
  if (amplitudeInitPromise) return amplitudeInitPromise;

  amplitudeInitPromise = (async () => {
    try {
      const { amplitudeApiKey } = getExtra();
      if (!amplitudeApiKey) {
        logger.warn('Amplitude API key missing (extra.amplitudeApiKey). Analytics disabled.');
        return false;
      }

      await Amplitude.init(amplitudeApiKey, undefined, {
        disableCookies: true,
      });
      return true;
    } catch (e) {
      logger.warn('Amplitude init failed', e);
      return false;
    }
  })();

  return amplitudeInitPromise;
};

const analyticsService = {
  isEnabled,

  async logEvent(name, params) {
    if (!isEnabled()) return;

    try {
      const ok = await ensureAmplitude();
      if (!ok) return;
      await Amplitude.track(String(name), safeParams(params));
    } catch (e) {
      logger.warn('analytics logEvent failed', e);
    }
  },

  async logScreenView(screenName, screenClassOverride) {
    if (!isEnabled()) return;

    try {
      const ok = await ensureAmplitude();
      if (!ok) return;

      const name = safeString(screenName);
      if (!name) return;

      await Amplitude.track('screen_view', {
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
      const ok = await ensureAmplitude();
      if (!ok) return;
      await Amplitude.setUserId(safeString(userId) || null);
    } catch (e) {
      logger.warn('analytics setUserId failed', e);
    }
  },

  async setUserProperties(props) {
    if (!isEnabled()) return;

    try {
      const ok = await ensureAmplitude();
      if (!ok) return;

      const identify = new Amplitude.Identify();
      const userProps = safeParams(props) || {};
      Object.keys(userProps).forEach((k) => {
        identify.set(k, userProps[k]);
      });

      await Amplitude.identify(identify);
    } catch (e) {
      logger.warn('analytics setUserProperties failed', e);
    }
  },
};

export default analyticsService;
