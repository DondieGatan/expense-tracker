import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Colors, withAlpha } from '../theme/colors';
import DashboardScreen from '../screens/DashboardScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import InsightsScreen from '../screens/InsightsScreen';
import BudgetScreen from '../screens/BudgetScreen';
import { HomeIcon, HistoryIcon, BudgetIcon, PlusIcon, SparklesIcon } from '../components/icons';
import AnimatedPressable from '../components/AnimatedPressable';
import PulseGlow from '../components/PulseGlow';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<string, (color: string) => React.ReactNode> = {
  Dashboard: (color) => <HomeIcon size={20} color={color} />,
  Expenses: (color) => <HistoryIcon size={20} color={color} />,
  Insights: (color) => <SparklesIcon size={20} color={color} />,
  Budget: (color) => <BudgetIcon size={20} color={color} />,
};

const TAB_LABELS: Record<string, string> = {
  Dashboard: 'Home',
  Expenses: 'History',
  Insights: 'Insights',
  Budget: 'Budget',
};

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, insets.bottom), [colors, insets.bottom]);
  const parent = navigation.getParent();

  const renderTab = (route: (typeof state.routes)[number]) => {
    const index = state.routes.indexOf(route);
    const focused = state.index === index;
    const color = focused ? colors.accent : colors.textMuted;
    return (
      <AnimatedPressable
        key={route.key}
        style={styles.item}
        onPress={() => navigation.navigate(route.name)}
        accessibilityRole="button"
        accessibilityLabel={TAB_LABELS[route.name]}
        accessibilityState={{ selected: focused }}
      >
        <View style={[styles.itemPill, focused && { backgroundColor: withAlpha(colors.accent, 0.16) }]}>
          {TAB_ICONS[route.name](color)}
        </View>
        <Text style={[styles.itemLabel, { color, fontWeight: focused ? '800' : '600' }]}>{TAB_LABELS[route.name]}</Text>
      </AnimatedPressable>
    );
  };

  return (
    <View style={styles.bar}>
      {state.routes.slice(0, 2).map(renderTab)}

      <View style={styles.fabWrap}>
        <PulseGlow color={colors.heroFrom} size={68} style={styles.fabGlow} />
        <AnimatedPressable scaleTo={0.88} onPress={() => parent?.navigate('ExpenseForm')} accessibilityLabel="Add expense">
          <LinearGradient colors={[colors.accent, colors.accentStrong]} style={styles.fab}>
            <PlusIcon size={24} color={colors.accentContrast} />
          </LinearGradient>
        </AnimatedPressable>
      </View>

      {state.routes.slice(2).map(renderTab)}
    </View>
  );
}

export default function AppTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Expenses" component={ExpensesScreen} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
      <Tab.Screen name="Budget" component={BudgetScreen} />
    </Tab.Navigator>
  );
}

const makeStyles = (colors: Colors, bottomInset: number) => StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: colors.tabBar, borderTopWidth: 1, borderTopColor: colors.border,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 10, paddingBottom: 10 + bottomInset, paddingHorizontal: 8,
    boxShadow: '0px -6px 20px rgba(0,0,0,0.25)', elevation: 16,
  },
  item: { alignItems: 'center', gap: 2, paddingHorizontal: 4, minWidth: 56 },
  itemPill: { width: 46, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  itemLabel: { fontSize: 10 },
  fabWrap: { alignItems: 'center', justifyContent: 'center', marginTop: -34 },
  fabGlow: { top: -9, left: -9 },
  fab: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: colors.bg,
  },
});
