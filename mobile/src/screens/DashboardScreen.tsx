import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, useWindowDimensions, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, FadeInRight } from 'react-native-reanimated';
import { colors, categoryChartColors } from '../theme/colors';
import { api } from '../api/client';
import { formatCurrency } from '../utils/format';
import { useCountUp } from '../utils/useCountUp';
import TxnRow from '../components/TxnRow';
import PulseGlow from '../components/PulseGlow';
import AnimatedPressable from '../components/AnimatedPressable';
import { ArrowUpIcon, ArrowDownIcon, BudgetIcon } from '../components/icons';
import type { DashboardData } from '../api/types';

const chartConfig = {
  backgroundGradientFrom: colors.surface,
  backgroundGradientTo: colors.surface,
  color: (opacity = 1) => `rgba(116, 242, 160, ${opacity})`,
  labelColor: () => colors.textMuted,
  decimalPlaces: 0,
  barPercentage: 0.6,
};

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = Math.max(windowWidth - 64, 240);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await api.get('/dashboard');
      setData(result);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const animatedThisMonth = useCountUp(data?.thisMonthTotal ?? 0);

  if (loading || !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  const overBudget = data.budgetLimit != null && data.thisMonthTotal > data.budgetLimit;
  const remaining = data.budgetLimit != null ? data.budgetLimit - data.thisMonthTotal : null;

  const pieData = data.byCategory.map((c, i) => ({
    name: c.category,
    population: c.total,
    color: categoryChartColors[i % categoryChartColors.length],
    legendFontColor: colors.textMuted,
    legendFontSize: 11,
  }));

  const barData = {
    labels: data.monthlyTrend.map((m) => m.label),
    datasets: [{ data: data.monthlyTrend.map((m) => m.total) }],
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <Animated.Text entering={FadeInDown.duration(400)} style={styles.pageTitle}>Dashboard</Animated.Text>

      <Animated.View entering={FadeInDown.duration(500).delay(60)} style={styles.balanceCardWrap}>
        <PulseGlow color={colors.accent} size={140} style={styles.balanceGlow} />
        <LinearGradient
          colors={[colors.accent, colors.accentStrong]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceLabel}>THIS MONTH</Text>
          <Text style={styles.balanceValue}>{formatCurrency(animatedThisMonth)}</Text>

          {data.budgetLimit != null ? (
            <View style={styles.balanceStats}>
              <View style={styles.balanceStat}>
                <View style={styles.balanceStatIcon}><BudgetIcon size={14} color={colors.accentContrast} /></View>
                <View>
                  <Text style={styles.balanceStatLabel}>Budget</Text>
                  <Text style={styles.balanceStatValue}>{formatCurrency(data.budgetLimit)}</Text>
                </View>
              </View>
              <View style={[styles.balanceStat, overBudget && styles.balanceStatNegative]}>
                <View style={[styles.balanceStatIcon, overBudget && styles.balanceStatIconNegative]}>
                  {overBudget ? <ArrowUpIcon size={14} color={colors.accentContrast} /> : <ArrowDownIcon size={14} color={colors.accentContrast} />}
                </View>
                <View>
                  <Text style={styles.balanceStatLabel}>{overBudget ? 'Over budget' : 'Remaining'}</Text>
                  <Text style={styles.balanceStatValue}>{formatCurrency(Math.abs(remaining ?? 0))}</Text>
                </View>
              </View>
            </View>
          ) : (
            <AnimatedPressable style={styles.balanceEmpty} onPress={() => navigation.navigate('Budget')}>
              <Text style={styles.balanceEmptyText}>No budget set yet</Text>
              <Text style={styles.balanceEmptyLink}>Set a monthly budget →</Text>
            </AnimatedPressable>
          )}
        </LinearGradient>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(120)} style={styles.statGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatCurrency(data.totalSpent)}</Text>
          <Text style={styles.statLabel}>Total Spent (All Time)</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data.expenseCount}</Text>
          <Text style={styles.statLabel}>Total Expenses</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(180)} style={styles.panel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Recent Expenses</Text>
          <AnimatedPressable onPress={() => navigation.navigate('Expenses')}>
            <Text style={styles.panelLink}>See all →</Text>
          </AnimatedPressable>
        </View>
        {data.recentExpenses.length ? (
          data.recentExpenses.map((e, i) => (
            <Animated.View key={e.id} entering={FadeInRight.duration(400).delay(220 + i * 60)}>
              <TxnRow expense={e} />
            </Animated.View>
          ))
        ) : (
          <Text style={styles.emptyText}>No expenses logged yet.</Text>
        )}
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(500).delay(240)} style={styles.panel}>
        <Text style={styles.panelTitle}>By Category</Text>
        {pieData.length ? (
          <PieChart
            data={pieData}
            width={chartWidth}
            height={180}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="8"
          />
        ) : (
          <Text style={styles.emptyText}>No data yet.</Text>
        )}
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(500).delay(300)} style={styles.panel}>
        <Text style={styles.panelTitle}>Spending Trend — Last 6 Months</Text>
        <BarChart
          data={barData}
          width={chartWidth}
          height={200}
          chartConfig={chartConfig}
          fromZero
          withInnerLines={false}
          showValuesOnTopOfBars
          yAxisLabel=""
          yAxisSuffix=""
          style={{ marginLeft: -16 }}
        />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 20, paddingBottom: 100 },
  pageTitle: { color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 16 },
  balanceCardWrap: { marginBottom: 16 },
  balanceGlow: { top: -30, right: -20 },
  balanceCard: { borderRadius: 22, padding: 22, overflow: 'hidden' },
  balanceLabel: { color: colors.accentContrast, opacity: 0.75, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  balanceValue: { color: colors.accentContrast, fontSize: 32, fontWeight: '800', marginTop: 4, marginBottom: 16 },
  balanceStats: { flexDirection: 'row', gap: 10 },
  balanceStat: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(6,33,15,0.18)', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12,
  },
  balanceStatNegative: {},
  balanceStatIcon: {
    width: 24, height: 24, borderRadius: 999, backgroundColor: 'rgba(6,33,15,0.28)',
    alignItems: 'center', justifyContent: 'center',
  },
  balanceStatIconNegative: { backgroundColor: 'rgba(6,33,15,0.4)' },
  balanceStatLabel: { color: colors.accentContrast, opacity: 0.75, fontSize: 10 },
  balanceStatValue: { color: colors.accentContrast, fontWeight: '700', fontSize: 13 },
  balanceEmpty: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' },
  balanceEmptyText: { color: colors.accentContrast, fontSize: 13 },
  balanceEmptyLink: { color: colors.accentContrast, fontWeight: '700', fontSize: 13, textDecorationLine: 'underline' },
  statGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  statValue: { color: colors.text, fontSize: 18, fontWeight: '700' },
  statLabel: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  panel: { backgroundColor: colors.surface, borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  panelTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  panelLink: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  emptyText: { color: colors.textMuted, fontSize: 13, paddingVertical: 12, textAlign: 'center' },
});
