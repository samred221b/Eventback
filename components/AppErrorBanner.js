import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { APP_ERROR_SEVERITY } from '../utils/appError';

const AppErrorBanner = memo(({ error, onRetry, disabled = false }) => {
  if (!error) return null;

  const severity = error.severity || APP_ERROR_SEVERITY.ERROR;

  const backgroundColor =
    severity === APP_ERROR_SEVERITY.INFO
      ? '#2563EB'
      : severity === APP_ERROR_SEVERITY.WARNING
        ? '#F59E0B'
        : '#EF4444';

  const iconName =
    severity === APP_ERROR_SEVERITY.INFO
      ? 'info'
      : severity === APP_ERROR_SEVERITY.WARNING
        ? 'alert-triangle'
        : 'x-circle';

  return (
    <View style={[styles.wrapper, { backgroundColor }]}>
      <View style={styles.row}>
        <Feather name={iconName} size={16} color="#FFFFFF" style={styles.icon} />
        <View style={styles.textWrap}>
          <Text style={styles.title} numberOfLines={2}>
            {error.userMessage}
          </Text>
          {!!error.details && (
            <Text style={styles.details} numberOfLines={2}>
              {String(error.details)}
            </Text>
          )}
        </View>
        {onRetry && error.retryable !== false && (
          <TouchableOpacity
            onPress={onRetry}
            disabled={disabled}
            activeOpacity={0.7}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

export default AppErrorBanner;

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 10,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  details: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.92)',
    fontSize: 12,
    fontWeight: '500',
  },
  retryButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 14,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
