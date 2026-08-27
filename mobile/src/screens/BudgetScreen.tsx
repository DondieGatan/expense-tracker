import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../theme/colors';
import { api, ApiError } from '../api/client';
import { formatCurrency } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import type { Currency } from '../api/types';
import { BudgetIcon } from '../components/icons';
import AnimatedPressable from '../components/AnimatedPressable';
import Skeleton from '../components/Skeleton';

export default function BudgetScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, insets.top), [colors, insets.top]);
  const { user, updateCurrency } = useAuth();
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [thisMonthSpent, setThisMonthSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [currencies, setCurrencies] = useState<Currency[] | null>(null);
  const [savingCurrency, setSavingCurrency] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        try {
          const [budgetData, dashboardData] = await Promise.all([
            api.get('/budget'),
            api.get('/dashboard'),
          ]);
          if (!active) return;
          if (budgetData.budget) setMonthlyLimit(String(budgetData.budget.monthlyLimit));
          setThisMonthSpent(dashboardData.thisMonthTotal ?? 0);
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => { active = false; };
    }, [])
  );

  useEffect(() => {
    api.get('/auth/currencies')
      .then((data) => setCurrencies(data.currencies))
      .catch(() => setCurrencies([]));
  }, []);

  const onSelectCurrency = async (code: string) => {
    if (code === user?.currency || savingCurrency) return;
    setSavingCurrency(code);
    try {
      await updateCurrency(code);
      if (Platform.OS !== 'web') Haptics.selectionAsync();
    } catch {
      // Selection just doesn't visibly change — the chip row re-renders
      // from user.currency, which only advances on success.
    } finally {
      setSavingCurrency(null);
    }
  };

  const onSubmit = async () => {
    setError(null);
    setSaved(false);
    setSubmitting(true);
    try {
      await api.put('/budget', { monthlyLimit: Number(monthlyLimit) });
      setSaved(true);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.flex}>
        <View style={styles.header}>
          <Skeleton width={44} height={44} borderRadius={14} />
          <View style={{ gap: 6 }}>
            <Skeleton width={140} height={16} />
            <Skeleton width={180} height={11} />
          </View>
        </View>
        <Skeleton height={180} borderRadius={18} />
      </View>
    );
  }

  const limitValue = Number(monthlyLimit) || 0;
  const hasLimit = limitValue > 0;
  const percentUsed = hasLimit ? Math.min(100, (thisMonthSpent / limitValue) * 100) : 0;
  const overBudget = hasLimit && thisMonthSpent > limitValue;

  return (
    <View style={styles.flex}>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <View style={styles.headerIcon}>
          <BudgetIcon size={20} color={colors.accent} />
        </View>
        <View>
          <Text style={styles.pageTitle}>Monthly Budget</Text>
          <Text style={styles.pageSubtitle}>Set a spending limit and track it live</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(450).delay(60)} style={styles.card}>
        <Text style={styles.label}>Currency</Text>
        <Text style={styles.currencyHint}>Every amount you enter is in this currency.</Text>
        {currencies === null ? (
          <Skeleton height={36} borderRadius={999} />
        ) : (
          <View style={styles.currencyRow}>
            {currencies.map((c) => {
              const active = c.code === user?.currency;
              return (
                <AnimatedPressable
                  key={c.code}
                  style={[styles.currencyChip, active && styles.currencyChipActive]}
                  onPress={() => onSelectCurrency(c.code)}
                  disabled={savingCurrency !== null}
                >
                  {savingCurrency === c.code ? (
                    <ActivityIndicator size="small" color={active ? colors.accentContrast : colors.text} />
                  ) : (
                    <Text style={[styles.currencyChipText, active && styles.currencyChipTextActive]}>{c.code}</Text>
                  )}
                </AnimatedPressable>
              );
            })}
          </View>
        )}
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(450).delay(120)} style={styles.card}>
        {saved ? <Text style={styles.success}>Budget updated.</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>Monthly Limit</Text>
        <View style={styles.inputRow}>
          <Text style={styles.inputPrefix}>{user?.currency ?? 'AED'}</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 15000"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            value={monthlyLimit}
            onChangeText={(v) => { setMonthlyLimit(v); setSaved(false); }}
          />
        </View>

        {hasLimit ? (
          <Animated.View entering={FadeIn.duration(300)} layout={Layout.springify()} style={styles.progressBlock}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${percentUsed}%` },
                  overBudget && styles.progressFillOver,
                ]}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={[styles.progressText, overBudget && styles.progressTextOver]}>
                {formatCurrency(thisMonthSpent)} spent this month
              </Text>
              <Text style={[styles.progressPercent, overBudget && styles.progressTextOver]}>
                {Math.round((thisMonthSpent / limitValue) * 100)}%
              </Text>
            </View>
          </Animated.View>
        ) : null}

        <AnimatedPressable
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={onSubmit}
          disabled={submitting || !monthlyLimit}
        >
          {submitting ? <ActivityIndicator color={colors.accentContrast} /> : <Text style={styles.buttonText}>Save Budget</Text>}
        </AnimatedPressable>
      </Animated.View>
    </View>
  );
}

const makeStyles = (colors: Colors, topInset: number) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg, padding: 20, paddingTop: 20 + topInset },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  headerIcon: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  pageTitle: { color: colors.text, fontSize: 20, fontWeight: '700' },
  pageSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  card: {
    backgroundColor: colors.surface, borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: colors.border, marginBottom: 16,
  },
  success: { color: colors.accent, fontSize: 13, marginBottom: 10 },
  error: { color: colors.danger, fontSize: 13, marginBottom: 10 },
  label: { color: colors.textMuted, fontSize: 12, marginBottom: 6 },
  currencyHint: { color: colors.textMuted, fontSize: 11.5, marginBottom: 12 },
  currencyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  currencyChip: {
    minWidth: 62, height: 36, paddingHorizontal: 14, borderRadius: 999,
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  currencyChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  currencyChipText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  currencyChipTextActive: { color: colors.accentContrast },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.bg, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14,
  },
  inputPrefix: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
  input: { flex: 1, color: colors.text, paddingVertical: 12, fontSize: 14 },
  progressBlock: { marginTop: 18 },
  progressTrack: {
    height: 10, borderRadius: 999, backgroundColor: colors.surface2, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: colors.accent },
  progressFillOver: { backgroundColor: colors.danger },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressText: { color: colors.textMuted, fontSize: 12 },
  progressPercent: { color: colors.text, fontSize: 12, fontWeight: '700' },
  progressTextOver: { color: colors.danger },
  button: { backgroundColor: colors.accent, borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.accentContrast, fontWeight: '700', fontSize: 15 },
});
