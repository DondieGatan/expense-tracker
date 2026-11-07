import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Colors, withAlpha } from '../theme/colors';
import DashboardScreen from '../screens/DashboardScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import InsightsScreen from '../screens/InsightsScreen';
import BudgetScreen from '../screens/BudgetScreen';
import { HomeIcon, HistoryIcon, BudgetIcon, SparklesIcon } from '../components/icons';
import AnimatedPressable from '../components/AnimatedPressable';
import FabButton from '../components/FabButton';
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
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, insets.bottom, isDark), [colors, insets.bottom, isDark]);
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

      <FabButton onPress={() => parent?.navigate('ExpenseForm')} />

      {state.routes.slice(2).map(renderTab)}
    </View>
  );
}

// On web the tabs you are not looking at stay stacked behind the current one and, left alone, are still reachable with
// the Tab key (focus lands in an invisible search box) and by screen readers. Marking a blurred tab `inert` takes the
// whole subtree out of the focus order and the accessibility tree while keeping it mounted, so its scroll position
// survives. (`visibility: hidden` is not enough: Reanimated's entering animations set their own `visibility: visible`
// on the rows inside.) Native platforms are untouched.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hideWhenBlurred(Screen: React.ComponentType<any>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function TabScene(props: any) {
    const focused = useIsFocused();
    const ref = useRef<View>(null);
    useEffect(() => {
      if (Platform.OS !== 'web') return;
      const node = ref.current as unknown as HTMLElement | null;
      if (!node || typeof node.setAttribute !== 'function') return;
      if (focused) node.removeAttribute('inert');
      else node.setAttribute('inert', '');
    }, [focused]);
    if (Platform.OS !== 'web') return <Screen {...props} />;
    return (
      <View ref={ref} style={{ flex: 1 }}>
        <Screen {...props} />
      </View>
    );
  };
}

const HomeTab = hideWhenBlurred(DashboardScreen);
const HistoryTab = hideWhenBlurred(ExpensesScreen);
const InsightsTab = hideWhenBlurred(InsightsScreen);
const BudgetTab = hideWhenBlurred(BudgetScreen);

export default function AppTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={HomeTab} />
      <Tab.Screen name="Expenses" component={HistoryTab} />
      <Tab.Screen name="Insights" component={InsightsTab} />
      <Tab.Screen name="Budget" component={BudgetTab} />
    </Tab.Navigator>
  );
}

const makeStyles = (colors: Colors, bottomInset: number, isDark: boolean) => StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: colors.tabBar, borderTopWidth: 1, borderTopColor: colors.border,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 10, paddingBottom: 10 + bottomInset, paddingHorizontal: 8,
    boxShadow: isDark ? '0px -6px 20px rgba(0,0,0,0.30)' : '0px -4px 18px rgba(0,84,95,0.10)', elevation: 16,
  },
  item: { alignItems: 'center', gap: 2, paddingHorizontal: 4, minWidth: 56 },
  itemPill: { width: 46, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  itemLabel: { fontSize: 10 },
});
