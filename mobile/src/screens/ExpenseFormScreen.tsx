import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../theme/colors';
import { api, ApiError } from '../api/client';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, QUICK_ADD_TEMPLATES } from '../theme/constants';
import { BackIcon, CategoryIcon } from '../components/icons';
import AnimatedPressable from '../components/AnimatedPressable';
import DateField from '../components/DateField';
import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'ExpenseForm'>;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function haptic(type: 'success' | 'error' | 'select') {
  if (Platform.OS === 'web') return;
  if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  else if (type === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  else Haptics.selectionAsync();
}

export default function ExpenseFormScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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
  const [error, setError] = useState<string | null>(null);

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
      haptic('success');
      navigation.goBack();
    } catch (e) {
      haptic('error');
      setError(e instanceof ApiError ? e.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
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
          <Text style={styles.pageTitle}>{isEdit ? 'Edit Expense' : 'Add Expense'}</Text>
        </Animated.View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

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

        <Text style={styles.label}>Category</Text>
        <Animated.View entering={FadeInDown.duration(400).delay(60)} style={styles.chipGroup}>
          {EXPENSE_CATEGORIES.map((c) => (
            <AnimatedPressable
              key={c}
              scaleTo={0.92}
              style={[styles.chip, category === c && styles.chipActive]}
              onPress={() => { haptic('select'); setCategory(c); }}
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

const makeStyles = (colors: Colors) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 20, paddingBottom: 60 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  backLink: {
    width: 34, height: 34, borderRadius: 999, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  pageTitle: { color: colors.text, fontSize: 20, fontWeight: '700' },
  error: { color: colors.danger, fontSize: 13, marginBottom: 12 },
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
