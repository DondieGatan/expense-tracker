import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import AppStack from './AppStack';

export default function RootNavigator() {
  const { colors, isDark } = useTheme();
  const { user, loading, retryStatus } = useAuth();

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

  return (
    <NavigationContainer theme={navTheme}>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
