import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { api, ApiError } from '../api/client';

export default function BudgetScreen() {
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        try {
          const data = await api.get('/budget');
          if (active && data.budget) setMonthlyLimit(String(data.budget.monthlyLimit));
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => { active = false; };
    }, [])
  );

  const onSubmit = async () => {
    setError(null);
    setSaved(false);
    setSubmitting(true);
    try {
      await api.put('/budget', { monthlyLimit: Number(monthlyLimit) });
      setSaved(true);
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
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Set Monthly Budget</Text>

      {saved ? <Text style={styles.success}>Budget updated.</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.label}>Monthly Limit</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 15000"
        placeholderTextColor={colors.textMuted}
        keyboardType="decimal-pad"
        value={monthlyLimit}
        onChangeText={(v) => { setMonthlyLimit(v); setSaved(false); }}
      />

      <TouchableOpacity
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={onSubmit}
        disabled={submitting || !monthlyLimit}
      >
        {submitting ? <ActivityIndicator color={colors.accentContrast} /> : <Text style={styles.buttonText}>Save Budget</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: colors.bg, padding: 20 },
  pageTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 16 },
  success: { color: colors.accent, fontSize: 13, marginBottom: 10 },
  error: { color: colors.danger, fontSize: 13, marginBottom: 10 },
  label: { color: colors.textMuted, fontSize: 12, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    color: colors.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
  },
  button: { backgroundColor: colors.accent, borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.accentContrast, fontWeight: '700', fontSize: 15 },
});
