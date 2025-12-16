import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';

const ConnectionErrorBanner = memo(({
  message = "Connection lost. Some features may be limited.",
  onRetry,
  disabled = false,
}) => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.banner}>
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Feather name="wifi-off" size={16} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{message}</Text>
          </View>
          {onRetry && (
            <TouchableOpacity
              onPress={onRetry}
              disabled={disabled}
              activeOpacity={0.7}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Refresh</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
});

export default ConnectionErrorBanner;

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  banner: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    marginRight: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
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
    fontWeight: '600',
  },
});
