import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import DashboardScreen from '../screens/DashboardScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import BudgetScreen from '../screens/BudgetScreen';
import { HomeIcon, HistoryIcon, BudgetIcon, PlusIcon, LogoutIcon } from '../components/icons';
import AnimatedPressable from '../components/AnimatedPressable';
import PulseGlow from '../components/PulseGlow';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<string, (color: string) => React.ReactNode> = {
  Dashboard: (color) => <HomeIcon size={20} color={color} />,
  Expenses: (color) => <HistoryIcon size={20} color={color} />,
  Budget: (color) => <BudgetIcon size={20} color={color} />,
};

const TAB_LABELS: Record<string, string> = {
  Dashboard: 'Home',
  Expenses: 'History',
  Budget: 'Budget',
};

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { logout } = useAuth();
  const parent = navigation.getParent();

  return (
    <View style={styles.bar}>
      {state.routes.slice(0, 2).map((route, index) => {
        const focused = state.index === index;
        const color = focused ? colors.accent : colors.textMuted;
        return (
          <AnimatedPressable key={route.key} style={styles.item} onPress={() => navigation.navigate(route.name)}>
            {TAB_ICONS[route.name](color)}
            <Text style={[styles.itemLabel, { color }]}>{TAB_LABELS[route.name]}</Text>
          </AnimatedPressable>
        );
      })}

      <View style={styles.fabWrap}>
        <PulseGlow color={colors.accent} size={64} style={styles.fabGlow} />
        <AnimatedPressable scaleTo={0.88} onPress={() => parent?.navigate('ExpenseForm')}>
          <LinearGradient colors={[colors.accent, colors.accentStrong]} style={styles.fab}>
            <PlusIcon size={22} color={colors.accentContrast} />
          </LinearGradient>
        </AnimatedPressable>
      </View>

      {state.routes.slice(2).map((route) => {
        const index = state.routes.indexOf(route);
        const focused = state.index === index;
        const color = focused ? colors.accent : colors.textMuted;
        return (
          <AnimatedPressable key={route.key} style={styles.item} onPress={() => navigation.navigate(route.name)}>
            {TAB_ICONS[route.name](color)}
            <Text style={[styles.itemLabel, { color }]}>{TAB_LABELS[route.name]}</Text>
          </AnimatedPressable>
        );
      })}

      <AnimatedPressable style={styles.item} onPress={logout}>
        <LogoutIcon size={20} color={colors.textMuted} />
        <Text style={[styles.itemLabel, { color: colors.textMuted }]}>Logout</Text>
      </AnimatedPressable>
    </View>
  );
}

export default function AppTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Expenses" component={ExpensesScreen} />
      <Tab.Screen name="Budget" component={BudgetScreen} />
    </Tab.Navigator>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    paddingVertical: 10, paddingHorizontal: 8,
  },
  item: { alignItems: 'center', gap: 2, paddingHorizontal: 6 },
  itemLabel: { fontSize: 10, fontWeight: '600' },
  fabWrap: { alignItems: 'center', justifyContent: 'center', marginTop: -26 },
  fabGlow: { top: -7, left: -7 },
  fab: {
    width: 50, height: 50, borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: colors.bg,
  },
});
