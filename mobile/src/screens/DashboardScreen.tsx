import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, FadeInRight } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Colors, categoryColor, withAlpha } from '../theme/colors';
import { api } from '../api/client';
import { getInsights } from '../api/insights';
import { formatCurrency, formatCurrencyCompact, greeting } from '../utils/format';
import { useCountUp } from '../utils/useCountUp';
import TxnRow from '../components/TxnRow';
import Skeleton from '../components/Skeleton';
import AuroraBackground from '../components/AuroraBackground';
import AnimatedPressable from '../components/AnimatedPressable';
import DonutChart from '../components/DonutChart';
import TrendBars from '../components/TrendBars';
import AiBadge from '../components/AiBadge';
import GlowBlob from '../components/GlowBlob';
import DisplayText from '../components/DisplayText';
import FitText from '../components/FitText';
import { SunIcon, MoonIcon, EmptyBoxIcon, PlusIcon, SparklesIcon, ArrowRightIcon } from '../components/icons';
import type { DashboardData, Insights } from '../api/types';

const MAX_SLICES = 5;

export default function DashboardScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, insets.top), [colors, insets.top]);

  const navigation = useNavigation<any>();
  const [data, setData] = useState<DashboardData | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
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
    // The coach card is a bonus: it loads after the numbers and a failure just hides it.
    getInsights().then(setInsights).catch(() => setInsights(null));
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
  const firstName = user?.fullName?.split(' ')[0] ?? '';

  const header = (
    <View style={styles.headerRow}>
      <View style={{ flex: 1 }}>
        <Animated.Text entering={FadeInDown.duration(400)} style={styles.greeting}>{greeting()}{firstName ? ',' : ''}</Animated.Text>
        <Animated.View entering={FadeInDown.duration(400).delay(40)}>
          <DisplayText style={styles.pageTitle} numberOfLines={1}>{firstName || 'Dashboard'}</DisplayText>
        </Animated.View>
      </View>
      <AnimatedPressable style={styles.themeToggle} hitSlop={16} onPress={toggleTheme} accessibilityLabel="Toggle light or dark theme">
        {isDark ? <SunIcon size={17} color={colors.text} /> : <MoonIcon size={17} color={colors.text} />}
      </AnimatedPressable>
    </View>
  );

  if (loading || !data) {
    return (
      <View style={styles.flex}>
        <AuroraBackground />
        <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
          {header}
          <Skeleton height={180} borderRadius={26} style={{ marginBottom: 16 }} />
          <Skeleton height={84} borderRadius={20} style={{ marginBottom: 16 }} />
          <Skeleton height={230} borderRadius={22} style={{ marginBottom: 16 }} />
          <Skeleton height={190} borderRadius={22} />
        </ScrollView>
      </View>
    );
  }

  const overBudget = data.budgetLimit != null && data.thisMonthTotal > data.budgetLimit;
  const remaining = data.budgetLimit != null ? data.budgetLimit - data.thisMonthTotal : null;
  const usedPercent = data.budgetLimit ? Math.min(100, (data.thisMonthTotal / data.budgetLimit) * 100) : 0;

  const top = data.byCategory.slice(0, MAX_SLICES);
  const otherTotal = data.byCategory.slice(MAX_SLICES).reduce((sum, c) => sum + c.total, 0);
  const slices = [
    ...top.map((c) => ({ label: c.category, value: c.total, color: categoryColor(c.category) })),
    ...(otherTotal > 0 ? [{ label: 'Other', value: otherTotal, color: colors.textMuted }] : []),
  ];
  const sliceTotal = slices.reduce((sum, s) => sum + s.value, 0);

  return (
    <View style={styles.flex}>
      <AuroraBackground />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {header}

        <Animated.View entering={FadeInDown.duration(500).delay(60)} style={styles.heroWrap}>
          <LinearGradient
            colors={[colors.heroFrom, colors.heroTo]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <GlowBlob size={300} color="#d6fb00" style={styles.heroGlowA} />
            <GlowBlob size={220} color="#18a3b3" style={styles.heroGlowB} />
            <Text style={styles.heroLabel}>SPENT THIS MONTH</Text>
            <FitText display style={styles.heroValue} maxSize={38} minSize={22} fitTo={formatCurrency(data.thisMonthTotal)}>{formatCurrency(animatedThisMonth)}</FitText>

            {data.budgetLimit != null ? (
              <View>
                <View style={styles.heroTrack}>
                  <View style={[styles.heroFill, { width: `${usedPercent}%` }, overBudget && styles.heroFillOver]} />
                </View>
                <View style={styles.heroMetaRow}>
                  <Text style={styles.heroMeta}>
                    {overBudget ? 'Over budget by ' : 'Left to spend '}
                    <Text style={styles.heroMetaStrong}>{formatCurrency(Math.abs(remaining ?? 0))}</Text>
                  </Text>
                  <Text style={styles.heroMeta}>of {formatCurrency(data.budgetLimit)}</Text>
                </View>
              </View>
            ) : (
              <AnimatedPressable style={styles.heroEmpty} onPress={() => navigation.navigate('Budget')}>
                <Text style={styles.heroMeta}>No budget set yet</Text>
                <Text style={styles.heroLink}>Set a monthly budget →</Text>
              </AnimatedPressable>
            )}
          </LinearGradient>
        </Animated.View>

        {insights && insights.hasData ? (
          <Animated.View entering={FadeInDown.duration(500).delay(110)}>
            <AnimatedPressable scaleTo={0.98} style={styles.coach} onPress={() => navigation.navigate('Insights')}>
              <View style={styles.coachIcon}>
                <SparklesIcon size={18} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.coachTop}>
                  <Text style={styles.coachTitle}>Your coach</Text>
                  <AiBadge source={insights.source} />
                </View>
                <Text style={styles.coachText} numberOfLines={3}>{insights.headline}</Text>
              </View>
              <ArrowRightIcon size={16} color={colors.textMuted} />
            </AnimatedPressable>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.duration(500).delay(150)} style={styles.statGrid}>
          <View style={styles.statCard}>
            <FitText style={styles.statValue} maxSize={18} minSize={12}>{formatCurrencyCompact(data.totalSpent)}</FitText>
            <Text style={styles.statLabel}>Total spent</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{data.expenseCount}</Text>
            <Text style={styles.statLabel}>Expenses logged</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(190)} style={styles.panel}>
          <Text style={styles.panelTitle}>Where it goes</Text>
          {slices.length ? (
            <View style={styles.donutRow}>
              <DonutChart
                slices={slices}
                size={150}
                thickness={20}
                centerValue={formatCurrencyCompact(sliceTotal)}
                centerLabel="all time"
              />
              <View style={styles.legend}>
                {slices.map((s) => (
                  <View key={s.label} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                    <Text style={styles.legendName} numberOfLines={1}>{s.label}</Text>
                    <Text style={styles.legendPct}>{Math.round((s.value / sliceTotal) * 100)}%</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>No data yet.</Text>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(240)} style={styles.panel}>
          <Text style={styles.panelTitle}>Last 6 months</Text>
          <TrendBars data={data.monthlyTrend} />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(280)} style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Recent</Text>
            <AnimatedPressable onPress={() => navigation.navigate('Expenses')}>
              <Text style={styles.panelLink}>See all →</Text>
            </AnimatedPressable>
          </View>
          {data.recentExpenses.length ? (
            data.recentExpenses.map((e, i) => (
              <Animated.View key={e.id} entering={FadeInRight.duration(400).delay(300 + i * 60)}>
                <TxnRow expense={e} />
              </Animated.View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <EmptyBoxIcon size={24} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No expenses yet</Text>
              <Text style={styles.emptyText}>Add your first expense, or type it in plain words.</Text>
              <AnimatedPressable
                style={styles.emptyButton}
                onPress={() => navigation.getParent()?.navigate('ExpenseForm')}
              >
                <PlusIcon size={14} color={colors.accentContrast} />
                <Text style={styles.emptyButtonText}>Add expense</Text>
              </AnimatedPressable>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: Colors, topInset: number) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 20, paddingTop: 16 + topInset, paddingBottom: 120 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  greeting: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  pageTitle: { color: colors.text, fontSize: 26, fontWeight: '800', marginTop: 1 },
  themeToggle: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  heroWrap: {
    marginBottom: 14, borderRadius: 26,
    boxShadow: `0px 12px 24px ${withAlpha(colors.heroFrom, 0.35)}`, elevation: 8,
  },
  hero: { borderRadius: 26, padding: 22, overflow: 'hidden' },
  heroGlowA: { position: 'absolute', right: -110, top: -140, opacity: 0.75 },
  heroGlowB: { position: 'absolute', left: -90, bottom: -130, opacity: 0.7 },
  heroLabel: { color: 'rgba(255,255,255,0.80)', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  heroValue: { color: '#ffffff', fontSize: 38, fontWeight: '800', marginTop: 6, marginBottom: 18 },
  heroTrack: { height: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.22)', overflow: 'hidden' },
  heroFill: { height: '100%', borderRadius: 999, backgroundColor: '#d6fb00' },
  heroFillOver: { backgroundColor: '#ff8a8a' },
  heroMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  heroMeta: { color: 'rgba(255,255,255,0.88)', fontSize: 12 },
  heroMetaStrong: { color: '#ffffff', fontWeight: '800' },
  heroEmpty: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  heroLink: { color: '#ffffff', fontWeight: '800', fontSize: 13, textDecorationLine: 'underline' },
  coach: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20, marginBottom: 14,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: withAlpha(colors.accent, 0.35),
  },
  coachIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: withAlpha(colors.accent, 0.16), alignItems: 'center', justifyContent: 'center' },
  coachTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  coachTitle: { color: colors.text, fontWeight: '800', fontSize: 13 },
  coachText: { color: colors.textMuted, fontSize: 12.5, lineHeight: 17 },
  statGrid: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.border },
  statValue: { color: colors.text, fontSize: 18, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: 11.5, marginTop: 4 },
  panel: { backgroundColor: colors.surface, borderRadius: 22, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  panelTitle: { color: colors.text, fontSize: 15, fontWeight: '800', marginBottom: 4 },
  panelLink: { color: colors.accent, fontSize: 12, fontWeight: '800', paddingVertical: 9, paddingLeft: 8, marginVertical: -9 },
  donutRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 18, marginTop: 10 },
  legend: { flex: 1, minWidth: 130, gap: 9 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendName: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '600' },
  legendPct: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  emptyText: { color: colors.textMuted, fontSize: 13, paddingVertical: 12, textAlign: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 20 },
  emptyIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { color: colors.text, fontSize: 14, fontWeight: '800', marginBottom: 4 },
  emptyButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12,
    backgroundColor: colors.accent, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 18,
  },
  emptyButtonText: { color: colors.accentContrast, fontWeight: '800', fontSize: 13 },
});
