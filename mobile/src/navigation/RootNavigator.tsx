import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Platform } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import AppStack from './AppStack';
import { useWebFont } from '../hooks/useWebFont';

export default function RootNavigator() {
  useWebFont();
  const { colors, isDark } = useTheme();
  const { user, loading, retryStatus } = useAuth();

  // On web the page itself (behind and beside the app column) and the browser scrollbars follow the theme too.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    document.documentElement.style.backgroundColor = colors.bg;
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    document.body.style.backgroundColor = colors.bg;
  }, [colors.bg, isDark]);

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.bg,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      primary: colors.accent,
    },
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 }}>
        <ActivityIndicator color={colors.accent} size="large" />
        {retryStatus ? (
          <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center' }}>{retryStatus}</Text>
        ) : null}
      </View>
    );
  }

  // On a wide web window the app sits in a centred phone-width column instead of stretching edge to edge.
  return (
    <View style={[styles.outer, { backgroundColor: colors.bg }]}>
      <View style={styles.column}>
        <NavigationContainer theme={navTheme}>
          {user ? <AppStack /> : <AuthStack />}
        </NavigationContainer>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, alignItems: 'center' },
  column: { flex: 1, width: '100%', maxWidth: 560 },
});
