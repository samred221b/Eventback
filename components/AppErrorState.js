import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

const AppErrorState = memo(({ error, onRetry }) => {
  if (!error) return null;

  return (
    <View style={styles.container}>
      <Feather name="alert-circle" size={28} color="#DC2626" />
      <Text style={styles.title}>
        {error.userMessage}
      </Text>
      {!!error.details && (
        <Text style={styles.details}>
          {String(error.details)}
        </Text>
      )}
      {onRetry && error.retryable !== false && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.85}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

export default AppErrorState;

const styles = StyleSheet.create({
  container: {
    padding: 40,
    alignItems: 'center',
  },
  title: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  details: {
    marginTop: 6,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  retryButton: {
    marginTop: 14,
    backgroundColor: '#0277BD',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
