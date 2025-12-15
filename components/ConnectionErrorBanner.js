import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

export default function ConnectionErrorBanner({
  message = "We couldn't reach the server.",
  details,
  retryIn = 10,
  onRetry,
  disabled = false,
}) {
  const [secondsLeft, setSecondsLeft] = useState(retryIn);
  const timerRef = useRef(null);

  useEffect(() => {
    // Start / restart countdown
    if (disabled) return;

    timerRef.current && clearInterval(timerRef.current);
    setSecondsLeft(retryIn);

    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          // Auto retry once countdown hits 0
          onRetry && onRetry();
          return retryIn; // reset for potential subsequent errors
        }
        return s - 1;
      });
    }, 1000);

    return () => timerRef.current && clearInterval(timerRef.current);
  }, [retryIn, disabled]);

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={["#EF4444", "#B91C1C"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.banner}
      >
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Feather name="wifi-off" size={18} color="#FFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{message}</Text>
            {!!details && (
              <Text numberOfLines={2} style={styles.details}>
                {String(details)}
              </Text>
            )}
            <Text style={styles.countdown}>
              Retrying in {secondsLeft}s · You can also retry now
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.retryBtn, disabled && { opacity: 0.6 }]}
            onPress={onRetry}
            disabled={disabled}
            activeOpacity={0.85}
            accessibilityLabel="Retry connecting to server"
          >
            <Feather name="refresh-cw" size={14} color="#0F172A" />
            <Text style={styles.retryText}>Retry now</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    marginTop: 12,
  },
  banner: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  details: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginBottom: 6,
  },
  countdown: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  retryBtn: {
    backgroundColor: '#FBBF24',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  retryText: {
    color: '#0F172A',
    fontWeight: '800',
    marginLeft: 6,
  },
});
