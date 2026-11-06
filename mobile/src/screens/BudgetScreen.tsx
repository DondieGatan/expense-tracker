import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../theme/colors';
import { api, ApiError } from '../api/client';
import { getInsights, invalidateInsights } from '../api/insights';
import { formatCurrency } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import type { Currency } from '../api/types';
import { SparklesIcon, LogoutIcon } from '../components/icons';
import AnimatedPressable from '../components/AnimatedPressable';
import AuroraBackground from '../components/AuroraBackground';
import ProgressRing from '../components/ProgressRing';
import Skeleton from '../components/Skeleton';
import DisplayText from '../components/DisplayText';

export default function BudgetScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, insets.top), [colors, insets.top]);
  const { user, updateCurrency, logout } = useAuth();
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [thisMonthSpent, setThisMonthSpent] = useState(0);
  const [suggested, setSuggested] = useState<number | null>(null);
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
        // A budget suggestion from the user's own history: optional, so a failure just hides the chip.
        getInsights()
          .then((insights) => { if (active) setSuggested(insights.suggestedBudget ?? null); })
          .catch(() => { if (active) setSuggested(null); });
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
      invalidateInsights();
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
      invalidateInsights();
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
        <AuroraBackground />
        <View style={styles.container}>
          <Skeleton width={160} height={22} style={{ marginBottom: 18 }} />
          <Skeleton height={150} borderRadius={22} style={{ marginBottom: 14 }} />
          <Skeleton height={200} borderRadius={22} />
        </View>
      </View>
    );
  }

  const limitValue = Number(monthlyLimit) || 0;
  const hasLimit = limitValue > 0;
  const percentUsed = hasLimit ? (thisMonthSpent / limitValue) * 100 : 0;
  const overBudget = hasLimit && thisMonthSpent > limitValue;

  return (
    <View style={styles.flex}>
      <AuroraBackground />
      <ScrollView style={styles.flex} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <DisplayText style={styles.pageTitle}>Budget</DisplayText>
          <Text style={styles.pageSubtitle}>Set a monthly limit and watch it live</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(450).delay(60)} style={styles.card}>
          {saved ? <Text style={styles.success}>Budget updated.</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {hasLimit ? (
            <View style={styles.ringRow}>
              <ProgressRing
                percent={percentUsed}
                size={112}
                thickness={12}
                over={overBudget}
                label={`${Math.round(percentUsed)}%`}
                sublabel="used"
              />
              <View style={{ flex: 1, gap: 10 }}>
                <View>
                  <Text style={styles.ringLabel}>Spent this month</Text>
                  <Text style={[styles.ringValue, overBudget && { color: colors.danger }]}>{formatCurrency(thisMonthSpent)}</Text>
                </View>
                <View>
                  <Text style={styles.ringLabel}>{overBudget ? 'Over by' : 'Left to spend'}</Text>
                  <Text style={styles.ringValue}>{formatCurrency(Math.abs(limitValue - thisMonthSpent))}</Text>
                </View>
              </View>
            </View>
          ) : null}

          <Text style={styles.label}>Monthly limit</Text>
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

          {suggested ? (
            <AnimatedPressable
              scaleTo={0.97}
              style={styles.suggestion}
              onPress={() => { setMonthlyLimit(String(suggested)); setSaved(false); }}
            >
              <SparklesIcon size={14} color={colors.accent} />
              <Text style={styles.suggestionText}>
                Suggested from your history: <Text style={{ fontWeight: '800' }}>{formatCurrency(suggested)}</Text> (tap to use)
              </Text>
            </AnimatedPressable>
          ) : null}

          <AnimatedPressable
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={onSubmit}
            disabled={submitting || !monthlyLimit}
          >
            {submitting ? <ActivityIndicator color={colors.accentContrast} /> : <Text style={styles.buttonText}>Save budget</Text>}
          </AnimatedPressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(450).delay(120)} style={styles.card}>
          <Text style={styles.cardTitle}>Currency</Text>
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

        <Animated.View entering={FadeInDown.duration(450).delay(180)} style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>
          <Text style={styles.accountName}>{user?.fullName}</Text>
          <Text style={styles.currencyHint}>{user?.email}</Text>
          <AnimatedPressable style={styles.logoutBtn} onPress={logout} accessibilityLabel="Sign out">
            <LogoutIcon size={16} color={colors.danger} />
            <Text style={styles.logoutText}>Sign out</Text>
          </AnimatedPressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: Colors, topInset: number) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 20, paddingTop: 16 + topInset, paddingBottom: 130 },
  header: { marginBottom: 18 },
  pageTitle: { color: colors.text, fontSize: 26, fontWeight: '800' },
  pageSubtitle: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  card: { backgroundColor: colors.surface, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: colors.border, marginBottom: 14 },
  cardTitle: { color: colors.text, fontSize: 15, fontWeight: '800', marginBottom: 4 },
  success: { color: colors.success, fontSize: 13, fontWeight: '700', marginBottom: 10 },
  error: { color: colors.danger, fontSize: 13, marginBottom: 10 },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: 18, marginBottom: 18 },
  ringLabel: { color: colors.textMuted, fontSize: 12 },
  ringValue: { color: colors.text, fontSize: 18, fontWeight: '800', marginTop: 1 },
  label: { color: colors.textMuted, fontSize: 12, marginBottom: 6 },
  currencyHint: { color: colors.textMuted, fontSize: 12, marginBottom: 12 },
  currencyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  currencyChip: {
    minWidth: 62, height: 38, paddingHorizontal: 14, borderRadius: 999,
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  currencyChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  currencyChipText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  currencyChipTextActive: { color: colors.accentContrast },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.bg, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14,
  },
  inputPrefix: { color: colors.textMuted, fontSize: 14, fontWeight: '800' },
  input: { flex: 1, color: colors.text, paddingVertical: 13, fontSize: 15, fontWeight: '600' },
  suggestion: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, padding: 11, borderRadius: 14,
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border,
  },
  suggestionText: { flex: 1, color: colors.text, fontSize: 12.5, lineHeight: 17 },
  button: { backgroundColor: colors.accent, borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginTop: 18 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.accentContrast, fontWeight: '800', fontSize: 15 },
  accountName: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6,
    paddingVertical: 12, borderRadius: 999, backgroundColor: colors.dangerSoft,
  },
  logoutText: { color: colors.danger, fontWeight: '800', fontSize: 14 },
});
