import AsyncStorage from '@react-native-async-storage/async-storage';

import { logger } from './logger';

// Default TTL: 1 hour in milliseconds
const DEFAULT_TTL = 60 * 60 * 1000;

/**
 * Store data in AsyncStorage with a TTL
 * @param {string} key - The key to store the data under
 * @param {any} data - The data to store (will be stringified)
 * @param {number} [ttlMs=DEFAULT_TTL] - Time to live in milliseconds
 */
export const setWithTTL = async (key, data, ttlMs = DEFAULT_TTL) => {
  try {
    const item = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    };
    await AsyncStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    logger.error('Error saving to cache:', error);
  }
};

/**
 * Retrieve data from AsyncStorage, checking if it's still valid based on TTL
 * @param {string} key - The key to retrieve data for
 * @returns {Promise<{data: any, isExpired: boolean}>} - The cached data and expiration status
 */
export const getWithTTL = async (key) => {
  try {
    const itemStr = await AsyncStorage.getItem(key);
    if (!itemStr) return { data: null, isExpired: true };

    const item = JSON.parse(itemStr);
    const now = Date.now();
    const timestamp = Number(item?.timestamp) || 0;
    const ttl = Number(item?.ttl) || 0;

    if (!item || typeof item !== 'object' || !('data' in item)) {
      return { data: null, isExpired: true };
    }
    
    // Check if the item has expired
    if (ttl > 0 && now - timestamp > ttl) {
      // Optionally remove expired item
      // await AsyncStorage.removeItem(key);
      return { data: item.data, isExpired: true };
    }
    
    return { data: item.data, isExpired: false };
  } catch (error) {
    logger.error('Error reading from cache:', error);
    return { data: null, isExpired: true };
  }
};

/**
 * Clear expired items from AsyncStorage
 */
export const clearExpiredItems = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const now = Date.now();
    
    for (const key of keys) {
      try {
        const itemStr = await AsyncStorage.getItem(key);
        if (!itemStr) continue;
        
        const item = JSON.parse(itemStr);
        if (item && typeof item === 'object' && 'timestamp' in item && 'ttl' in item) {
          const timestamp = Number(item.timestamp) || 0;
          const ttl = Number(item.ttl) || 0;
          if (ttl > 0 && now - timestamp > ttl) {
            await AsyncStorage.removeItem(key);
          }
        }
      } catch (e) {
        // Skip individual item errors
        continue;
      }
    }
  } catch (error) {
    logger.error('Error clearing expired cache items:', error);
  }
};

// Export TTL constants for easy access
export const TTL = {
  ONE_HOUR: 60 * 60 * 1000,          // 1 hour
  THREE_HOURS: 3 * 60 * 60 * 1000,   // 3 hours
  SIX_HOURS: 6 * 60 * 60 * 1000,     // 6 hours
  TWELVE_HOURS: 12 * 60 * 60 * 1000, // 12 hours
  ONE_DAY: 24 * 60 * 60 * 1000,      // 1 day
};
