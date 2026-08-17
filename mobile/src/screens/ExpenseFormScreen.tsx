import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { api, ApiError } from '../api/client';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../theme/constants';
import { BackIcon } from '../components/icons';
import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'ExpenseForm'>;

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function ExpenseFormScreen({ route, navigation }: Props) {
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
      navigation.goBack();
    } catch (e) {
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
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
            <BackIcon size={16} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>{isEdit ? 'Edit Expense' : 'Add Expense'}</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

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
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
              value={date}
              onChangeText={setDate}
            />
          </View>
        </View>

        <Text style={styles.label}>Category</Text>
        <View style={styles.chipGroup}>
          {EXPENSE_CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, category === c && styles.chipActive]}
              onPress={() => setCategory(c)}
            >
              <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Payment Method</Text>
        <View style={styles.chipGroup}>
          {PAYMENT_METHODS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.chip, paymentMethod === p && styles.chipActive]}
              onPress={() => setPaymentMethod(p)}
            >
              <Text style={[styles.chipText, paymentMethod === p && styles.chipTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

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

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={onSubmit}
          disabled={submitting || !description || !amount}
        >
          {submitting ? (
            <ActivityIndicator color={colors.accentContrast} />
          ) : (
            <Text style={styles.buttonText}>{isEdit ? 'Save Changes' : 'Add Expense'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
  chip: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, backgroundColor: colors.surface2 },
  chipActive: { backgroundColor: colors.accent },
  chipText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: colors.accentContrast },
  button: {
    backgroundColor: colors.accent, borderRadius: 999, paddingVertical: 14,
    alignItems: 'center', marginTop: 26,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.accentContrast, fontWeight: '700', fontSize: 15 },
});
