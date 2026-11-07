import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Platform, useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { darkColors, lightColors, Colors } from '../theme/colors';

const THEME_KEY = 'expense_tracker_theme';

// What the person chose: follow the device, or force one. `theme` below is what is actually showing.
export type ThemeMode = 'system' | 'light' | 'dark';
type ThemeName = 'dark' | 'light';

interface ThemeContextValue {
  mode: ThemeMode;
  theme: ThemeName;
  colors: Colors;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

async function storageGet(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return window.localStorage.getItem(key);
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function storageSet(key: string, value: string) {
  try {
    if (Platform.OS === 'web') {
      window.localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch {
    // The choice still applies for this session if storage is unavailable.
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    (async () => {
      const stored = await storageGet(THEME_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') setModeState(stored);
    })();
  }, []);

  const theme: ThemeName = mode === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : mode;

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    storageSet(THEME_KEY, next);
  }, []);

  // The sun / moon button flips whatever is showing right now and pins that choice.
  const toggleTheme = useCallback(() => {
    setMode(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setMode]);

  const value = useMemo<ThemeContextValue>(() => ({
    mode,
    theme,
    colors: theme === 'dark' ? darkColors : lightColors,
    isDark: theme === 'dark',
    setMode,
    toggleTheme,
  }), [mode, theme, setMode, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
