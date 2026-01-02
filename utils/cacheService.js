import AsyncStorage from '@react-native-async-storage/async-storage';

import { logger } from './logger';

const CACHE_PREFIX = '@eventopia:';

export const TTL = {
  ONE_HOUR: 60 * 60 * 1000,
  THREE_HOURS: 3 * 60 * 60 * 1000,
  SIX_HOURS: 6 * 60 * 60 * 1000,
  TWELVE_HOURS: 12 * 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
};

const buildKey = (key) => {
  if (!key) return CACHE_PREFIX;
  if (key.startsWith(CACHE_PREFIX)) return key;
  return `${CACHE_PREFIX}${key}`;
};

const pack = (data, ttlMs) => ({
  v: 1,
  data,
  ts: Date.now(),
  ttl: typeof ttlMs === 'number' ? ttlMs : null,
});

const unpack = (raw) => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !('data' in parsed)) return null;
    return parsed;
  } catch (_) {
    return null;
  }
};

const isExpired = (item) => {
  if (!item) return true;
  const ttl = typeof item.ttl === 'number' ? item.ttl : null;
  if (!ttl || ttl <= 0) return false;
  const ts = typeof item.ts === 'number' ? item.ts : 0;
  return Date.now() - ts > ttl;
};

const cacheService = {
  async set(key, data, { ttlMs } = {}) {
    try {
      await AsyncStorage.setItem(buildKey(key), JSON.stringify(pack(data, ttlMs)));
      return true;
    } catch (error) {
      logger.error('Cache set failed', { key, error });
      return false;
    }
  },

  async get(key) {
    try {
      const raw = await AsyncStorage.getItem(buildKey(key));
      const item = unpack(raw);
      if (!item) return { data: null, isExpired: true };
      return { data: item.data, isExpired: isExpired(item) };
    } catch (error) {
      logger.error('Cache get failed', { key, error });
      return { data: null, isExpired: true };
    }
  },

  async remove(key) {
    try {
      await AsyncStorage.removeItem(buildKey(key));
      return true;
    } catch (error) {
      logger.error('Cache remove failed', { key, error });
      return false;
    }
  },

  async clearAll() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const toRemove = keys.filter((k) => k.startsWith(CACHE_PREFIX));
      if (toRemove.length) {
        await AsyncStorage.multiRemove(toRemove);
      }
      return true;
    } catch (error) {
      logger.error('Cache clearAll failed', { error });
      return false;
    }
  },
};

export default cacheService;
