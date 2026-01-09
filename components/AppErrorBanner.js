import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { APP_ERROR_SEVERITY } from '../utils/appError';

const AppErrorBanner = memo(({ error, onRetry, disabled = false, loading = false }) => {
  if (!error) return null;

  const severity = error.severity || APP_ERROR_SEVERITY.ERROR;

  const useGradient = severity === APP_ERROR_SEVERITY.WARNING || severity === APP_ERROR_SEVERITY.ERROR;
  const gradientColors = ['#0277BD', '#01579B'];
  const backgroundColor =
    severity === APP_ERROR_SEVERITY.INFO
      ? '#2563EB'
      : severity === APP_ERROR_SEVERITY.SUCCESS
        ? '#10B981'
        : '#0277BD';

  const iconName =
    severity === APP_ERROR_SEVERITY.INFO
      ? 'info'
      : severity === APP_ERROR_SEVERITY.WARNING
        ? 'alert-triangle'
        : severity === APP_ERROR_SEVERITY.SUCCESS
          ? 'check-circle'
          : 'x-circle';

  const BannerWrapper = useGradient ? LinearGradient : View;
  const wrapperStyle = useGradient 
    ? [styles.wrapper] 
    : [styles.wrapper, { backgroundColor }];

  return (
    <BannerWrapper 
      style={wrapperStyle}
      colors={useGradient ? gradientColors : undefined}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
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
        {loading ? (
          <View style={styles.loadingPill}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.loadingText}>Retrying...</Text>
          </View>
        ) : (onRetry && error.retryable !== false && severity !== APP_ERROR_SEVERITY.SUCCESS && (
          <TouchableOpacity
            onPress={onRetry}
            disabled={disabled || loading}
            activeOpacity={0.7}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        ))}
      </View>
    </BannerWrapper>
  );
});

export default AppErrorBanner;

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    fontSize: 13,
    fontWeight: '700',
  },
  details: {
    marginTop: 1,
    color: 'rgba(255,255,255,0.92)',
    fontSize: 11,
    fontWeight: '500',
  },
  retryButton: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingPill: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 6,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
