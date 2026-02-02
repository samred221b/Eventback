import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DefaultTheme, DarkTheme } from '@react-navigation/native';

const STORAGE_KEY = 'theme:mode';

const ThemeContext = createContext(null);

const lightColors = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  mutedText: '#64748B',
  border: '#E2E8F0',
  primary: '#0277BD',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E5E7EB',
};

const darkColors = {
  background: '#060B14',
  card: '#0B1220',
  text: '#E5E7EB',
  mutedText: '#94A3B8',
  border: 'rgba(255, 255, 255, 0.10)',
  primary: '#38BDF8',
  tabBar: '#0B1220',
  tabBarBorder: 'rgba(255, 255, 255, 0.10)',
};

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState('light');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!mounted) return;
        if (stored !== 'light') {
          try {
            await AsyncStorage.setItem(STORAGE_KEY, 'light');
          } catch (e) {
            // Silent fail
          }
        }
        setMode('light');
      } catch (e) {
        // Silent fail
      } finally {
        if (mounted) setHydrated(true);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const scheme = 'light';
  const isDark = false;

  const colors = lightColors;

  const setThemeMode = useCallback(async (nextMode) => {
    setMode('light');
    try {
      await AsyncStorage.setItem(STORAGE_KEY, 'light');
    } catch (e) {
      // Silent fail
    }
  }, []);

  const navigationTheme = useMemo(() => {
    const baseTheme = DefaultTheme;
    return {
      ...baseTheme,
      dark: isDark,
      colors: {
        ...baseTheme.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.card,
        text: colors.text,
        border: colors.border,
        notification: colors.primary,
      },
    };
  }, [isDark, colors]);

  const value = useMemo(() => {
    return {
      hydrated,
      mode,
      scheme,
      isDark,
      colors,
      setThemeMode,
      navigationTheme,
    };
  }, [hydrated, mode, scheme, isDark, colors, setThemeMode, navigationTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
