import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import AppStack from './AppStack';

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
  },
};

export default function RootNavigator() {
  const { user, loading, retryStatus } = useAuth();

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
