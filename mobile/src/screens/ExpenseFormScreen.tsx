import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { Colors, categoryColor, withAlpha } from '../theme/colors';
import { api, ApiError } from '../api/client';
import { invalidateInsights } from '../api/insights';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, QUICK_ADD_TEMPLATES } from '../theme/constants';
import { BackIcon, CategoryIcon, TrashIcon, SparklesIcon, CloseIcon } from '../components/icons';
import AnimatedPressable from '../components/AnimatedPressable';
import AiBadge from '../components/AiBadge';
import DateField from '../components/DateField';
import { formatCurrency, formatDate, todayIso } from '../utils/format';
import type { AppStackParamList } from '../navigation/types';
import type { CategorizeResult, ParseResult, SuggestedExpense } from '../api/types';
import DisplayText from '../components/DisplayText';

type Props = NativeStackScreenProps<AppStackParamList, 'ExpenseForm'>;

function today() {
  // The device's own calendar day (toISOString would give the UTC day, which is "yesterday" after midnight in the UAE).
  return todayIso();
}

function haptic(type: 'success' | 'error' | 'select') {
  if (Platform.OS === 'web') return;
  if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  else if (type === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  else Haptics.selectionAsync();
}

// RN Web's Alert.alert() is a no-op stub, so a confirmation on web needs its
// own path — this is the only delete entry point for the whole app on web,
// since SwipeableRow renders as a plain non-swipeable wrapper there.
function confirmDelete(description: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`Delete "${description}"?`)) onConfirm();
    return;
  }
  Alert.alert('Delete expense', `Delete "${description}"?`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onConfirm },
  ]);
}

export default function ExpenseFormScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, insets.top), [colors, insets.top]);
  const expenseId = route.params?.expenseId;
  const isEdit = expenseId != null;

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [category, setCategory] = useState('General');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI: category suggestion while typing, and "magic add" (type it in plain words).
  const categoryTouched = useRef(isEdit);
  const [suggestion, setSuggestion] = useState<CategorizeResult | null>(null);
  const [magicText, setMagicText] = useState('');
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicError, setMagicError] = useState<string | null>(null);
  const [magicItems, setMagicItems] = useState<SuggestedExpense[] | null>(null);
  const [magicSource, setMagicSource] = useState<ParseResult['source']>('rules');
  const [magicSaving, setMagicSaving] = useState(false);

  // Suggest a category from the description once the user pauses typing — unless they already picked one.
  useEffect(() => {
    if (categoryTouched.current || description.trim().length < 3) return;
    let stale = false;
    const timer = setTimeout(async () => {
      try {
        const result: CategorizeResult = await api.post('/ai/categorize', { description: description.trim() });
        if (stale || categoryTouched.current || !result.category) return;
        setCategory(result.category);
        setSuggestion(result);
      } catch {
        // A suggestion is a convenience; failing quietly leaves the category as it was.
      }
    }, 600);
    return () => { stale = true; clearTimeout(timer); };
  }, [description]);

  const onMagicParse = async () => {
    setMagicError(null);
    setMagicItems(null);
    setMagicLoading(true);
    try {
      const result: ParseResult = await api.post('/ai/parse', { text: magicText.trim(), today: todayIso() });
      setMagicItems(result.expenses);
      setMagicSource(result.source);
      haptic('select');
    } catch (e) {
      setMagicError(e instanceof ApiError ? e.message : 'Something went wrong.');
    } finally {
      setMagicLoading(false);
    }
  };

  const removeMagicItem = (index: number) => {
    setMagicItems((items) => {
      const next = (items ?? []).filter((_, i) => i !== index);
      return next.length ? next : null;
    });
  };

  const useMagicItemInForm = (item: SuggestedExpense) => {
    categoryTouched.current = true;
    setSuggestion(null);
    setDescription(item.description);
    setAmount(String(item.amount));
    setDate(item.date);
    setCategory(item.category);
    setPaymentMethod(item.paymentMethod);
    setMagicItems(null);
    setMagicText('');
  };

  const saveMagicItems = async () => {
    if (!magicItems?.length) return;
    setMagicSaving(true);
    setMagicError(null);
    try {
      for (const item of magicItems) {
        await api.post('/expenses', { ...item, notes: null });
      }
      invalidateInsights();
      haptic('success');
      navigation.goBack();
    } catch (e) {
      haptic('error');
      setMagicError(e instanceof ApiError ? e.message : 'Something went wrong.');
      setMagicSaving(false);
    }
  };

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const data = await api.get(`/expenses/${expenseId}`);
        const e = data.expense;
        setDescription(e.description);
        setAmount(String(e.amount));
        setDate(e.date);
        setCategory(e.category);
        setPaymentMethod(e.paymentMethod);
        setNotes(e.notes ?? '');
      } finally {
        setLoading(false);
      }
    })();
  }, [expenseId, isEdit]);

  const applyTemplate = (t: typeof QUICK_ADD_TEMPLATES[number]) => {
    haptic('select');
    categoryTouched.current = true;
    setSuggestion(null);
    setDescription(t.description);
    setAmount(t.amount);
    setCategory(t.category);
    setPaymentMethod(t.paymentMethod);
  };

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    const payload = { description, amount: Number(amount), date, category, paymentMethod, notes: notes || null };
    try {
      if (isEdit) {
        await api.put(`/expenses/${expenseId}`, payload);
      } else {
        await api.post('/expenses', payload);
      }
      invalidateInsights();
      haptic('success');
      navigation.goBack();
    } catch (e) {
      haptic('error');
      setError(e instanceof ApiError ? e.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = () => {
    confirmDelete(description, async () => {
      setDeleting(true);
      try {
        await api.delete(`/expenses/${expenseId}`);
        invalidateInsights();
        haptic('success');
        navigation.goBack();
      } catch (e) {
        haptic('error');
        setError(e instanceof ApiError ? e.message : 'Something went wrong.');
        setDeleting(false);
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View entering={FadeIn.duration(350)} style={styles.headerRow}>
          <AnimatedPressable style={styles.backLink} onPress={() => navigation.goBack()}>
            <BackIcon size={16} color={colors.text} />
          </AnimatedPressable>
          <DisplayText style={styles.pageTitle}>{isEdit ? 'Edit Expense' : 'Add Expense'}</DisplayText>
          {isEdit ? (
            <AnimatedPressable style={styles.deleteLink} onPress={onDelete} disabled={deleting}>
              {deleting ? (
                <ActivityIndicator size="small" color={colors.danger} />
              ) : (
                <TrashIcon size={16} color={colors.danger} />
              )}
            </AnimatedPressable>
          ) : null}
        </Animated.View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!isEdit ? (
          <Animated.View entering={FadeInDown.duration(400)}>
            <LinearGradient colors={[colors.aiFrom, colors.aiTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.magic}>
              <View style={styles.magicHead}>
                <View style={styles.magicIcon}><SparklesIcon size={16} color={colors.accent} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.magicTitle}>Magic add</Text>
                  <Text style={styles.magicSub}>Type it the way you would say it</Text>
                </View>
              </View>
              <TextInput
                style={styles.magicInput}
                placeholder="e.g. coffee 15 and taxi 30 yesterday"
                placeholderTextColor={colors.textMuted}
                value={magicText}
                onChangeText={(v) => { setMagicText(v); setMagicError(null); }}
                onSubmitEditing={() => magicText.trim().length >= 3 && onMagicParse()}
                returnKeyType="go"
                maxLength={600}
              />
              {magicError ? <Text style={styles.magicError}>{magicError}</Text> : null}

              {magicItems ? (
                <View style={{ marginTop: 10 }}>
                  <View style={styles.magicResultHead}>
                    <Text style={styles.magicResultTitle}>I found {magicItems.length} expense{magicItems.length > 1 ? 's' : ''}</Text>
                    <AiBadge source={magicSource} />
                  </View>
                  {magicItems.map((item, index) => (
                    <View key={`${item.description}-${index}`} style={styles.magicItem}>
                      <View style={[styles.magicItemIcon, { backgroundColor: withAlpha(categoryColor(item.category), 0.18) }]}>
                        <CategoryIcon category={item.category} size={15} color={categoryColor(item.category)} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.magicItemTitle} numberOfLines={1}>{item.description}</Text>
                        <Text style={styles.magicItemSub} numberOfLines={1}>
                          {item.category} · {formatDate(item.date)} · {item.paymentMethod}
                        </Text>
                      </View>
                      <Text style={styles.magicItemAmount}>{formatCurrency(item.amount)}</Text>
                      <AnimatedPressable hitSlop={10} onPress={() => removeMagicItem(index)} accessibilityLabel={`Remove ${item.description}`}>
                        <CloseIcon size={14} color={colors.textMuted} />
                      </AnimatedPressable>
                    </View>
                  ))}
                  <View style={styles.magicActions}>
                    <AnimatedPressable style={[styles.magicPrimary, magicSaving && { opacity: 0.7 }]} onPress={saveMagicItems} disabled={magicSaving}>
                      {magicSaving ? <ActivityIndicator size="small" color={colors.accentContrast} /> : (
                        <Text style={styles.magicPrimaryText}>Add {magicItems.length > 1 ? `all ${magicItems.length}` : 'it'}</Text>
                      )}
                    </AnimatedPressable>
                    {magicItems.length === 1 ? (
                      <AnimatedPressable style={styles.magicSecondary} onPress={() => useMagicItemInForm(magicItems[0])}>
                        <Text style={styles.magicSecondaryText}>Edit in form</Text>
                      </AnimatedPressable>
                    ) : null}
                  </View>
                </View>
              ) : (
                <AnimatedPressable
                  style={[styles.magicPrimary, { marginTop: 10 }, (magicLoading || magicText.trim().length < 3) && { opacity: 0.55 }]}
                  onPress={onMagicParse}
                  disabled={magicLoading || magicText.trim().length < 3}
                >
                  {magicLoading ? <ActivityIndicator size="small" color={colors.accentContrast} /> : <Text style={styles.magicPrimaryText}>Read it</Text>}
                </AnimatedPressable>
              )}
            </LinearGradient>
          </Animated.View>
        ) : null}

        {!isEdit ? (
          <Animated.View entering={FadeInDown.duration(400).delay(20)}>
            <Text style={styles.label}>Quick add</Text>
            <View style={styles.chipGroup}>
              {QUICK_ADD_TEMPLATES.map((t) => (
                <AnimatedPressable key={t.label} scaleTo={0.92} style={styles.templateChip} onPress={() => applyTemplate(t)}>
                  <CategoryIcon category={t.category} size={13} color={colors.accent} />
                  <Text style={styles.templateChipText}>{t.label}</Text>
                </AnimatedPressable>
              ))}
            </View>
          </Animated.View>
        ) : null}

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Groceries"
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
        />

        <View style={styles.fieldRow}>
          <View style={styles.fieldHalf}>
            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
          <View style={styles.fieldHalf}>
            <Text style={styles.label}>Date</Text>
            <DateField value={date} onChange={setDate} />
          </View>
        </View>

        <View style={styles.labelRow}>
          <Text style={[styles.label, { marginBottom: 0, marginTop: 0 }]}>Category</Text>
          {suggestion && suggestion.category === category ? (
            <Animated.View entering={FadeIn.duration(250)} style={styles.suggestedHint}>
              <SparklesIcon size={11} color={colors.accent2} />
              <Text style={styles.suggestedHintText}>Suggested from the description</Text>
            </Animated.View>
          ) : null}
        </View>
        <Animated.View entering={FadeInDown.duration(400).delay(60)} style={styles.chipGroup}>
          {EXPENSE_CATEGORIES.map((c) => (
            <AnimatedPressable
              key={c}
              scaleTo={0.92}
              style={[styles.chip, category === c && styles.chipActive]}
              onPress={() => { haptic('select'); categoryTouched.current = true; setSuggestion(null); setCategory(c); }}
            >
              <CategoryIcon category={c} size={13} color={category === c ? colors.accentContrast : colors.textMuted} />
              <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
            </AnimatedPressable>
          ))}
        </Animated.View>

        <Text style={styles.label}>Payment Method</Text>
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.chipGroup}>
          {PAYMENT_METHODS.map((p) => (
            <AnimatedPressable
              key={p}
              scaleTo={0.92}
              style={[styles.chip, paymentMethod === p && styles.chipActive]}
              onPress={() => { haptic('select'); setPaymentMethod(p); }}
            >
              <Text style={[styles.chipText, paymentMethod === p && styles.chipTextActive]}>{p}</Text>
            </AnimatedPressable>
          ))}
        </Animated.View>

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Optional"
          placeholderTextColor={colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />

        <AnimatedPressable
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={onSubmit}
          disabled={submitting || !description || !amount}
        >
          {submitting ? (
            <ActivityIndicator color={colors.accentContrast} />
          ) : (
            <Text style={styles.buttonText}>{isEdit ? 'Save Changes' : 'Add Expense'}</Text>
          )}
        </AnimatedPressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: Colors, topInset: number) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 20, paddingTop: 20 + topInset, paddingBottom: 60 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  backLink: {
    width: 34, height: 34, borderRadius: 999, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  pageTitle: { flex: 1, color: colors.text, fontSize: 20, fontWeight: '700' },
  deleteLink: {
    width: 34, height: 34, borderRadius: 999, backgroundColor: colors.dangerSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  error: { color: colors.danger, fontSize: 13, marginBottom: 12 },
  magic: { borderRadius: 22, padding: 16, marginBottom: 6, borderWidth: 1, borderColor: withAlpha(colors.accent, 0.3) },
  magicHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  magicIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: withAlpha(colors.accent, 0.18), alignItems: 'center', justifyContent: 'center' },
  magicTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  magicSub: { color: colors.textMuted, fontSize: 12, marginTop: 1 },
  magicInput: {
    backgroundColor: colors.bg, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    color: colors.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
  },
  magicError: { color: colors.danger, fontSize: 12.5, marginTop: 8 },
  magicResultHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  magicResultTitle: { color: colors.text, fontSize: 13, fontWeight: '800' },
  magicItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
  magicItemIcon: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  magicItemTitle: { color: colors.text, fontSize: 13.5, fontWeight: '700' },
  magicItemSub: { color: colors.textMuted, fontSize: 11.5, marginTop: 1 },
  magicItemAmount: { color: colors.text, fontSize: 13.5, fontWeight: '800' },
  magicActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  magicPrimary: { flex: 1, backgroundColor: colors.accent, borderRadius: 999, paddingVertical: 11, alignItems: 'center', justifyContent: 'center' },
  magicPrimaryText: { color: colors.accentContrast, fontWeight: '800', fontSize: 13.5 },
  magicSecondary: { flex: 1, borderRadius: 999, paddingVertical: 11, alignItems: 'center', backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  magicSecondaryText: { color: colors.text, fontWeight: '700', fontSize: 13.5 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 6 },
  suggestedHint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  suggestedHintText: { color: colors.accent2, fontSize: 11, fontWeight: '700' },
  label: { color: colors.textMuted, fontSize: 12, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    color: colors.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  fieldRow: { flexDirection: 'row', gap: 12 },
  fieldHalf: { flex: 1 },
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, backgroundColor: colors.surface2,
  },
  chipActive: { backgroundColor: colors.accent },
  chipText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: colors.accentContrast },
  templateChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999,
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border,
  },
  templateChipText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  button: {
    backgroundColor: colors.accent, borderRadius: 999, paddingVertical: 14,
    alignItems: 'center', marginTop: 26,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.accentContrast, fontWeight: '700', fontSize: 15 },
});
