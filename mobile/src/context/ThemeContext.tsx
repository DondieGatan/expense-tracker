import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { darkColors, lightColors, Colors } from '../theme/colors';

const THEME_KEY = 'expense_tracker_theme';

type ThemeName = 'dark' | 'light';

interface ThemeContextValue {
  theme: ThemeName;
  colors: Colors;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return window.localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function storageSet(key: string, value: string) {
  if (Platform.OS === 'web') {
    window.localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>('dark');

  useEffect(() => {
    (async () => {
      const stored = await storageGet(THEME_KEY);
      if (stored === 'light' || stored === 'dark') setTheme(stored);
    })();
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: ThemeName = prev === 'dark' ? 'light' : 'dark';
      storageSet(THEME_KEY, next);
      return next;
    });
  }, []);

  const value: ThemeContextValue = {
    theme,
    colors: theme === 'dark' ? darkColors : lightColors,
    isDark: theme === 'dark',
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
