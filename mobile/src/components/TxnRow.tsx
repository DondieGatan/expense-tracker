import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { CategoryIcon } from './icons';
import { formatCurrency, formatDate } from '../utils/format';
import type { Expense } from '../api/types';

interface Props {
  expense: Expense;
  onPress?: () => void;
  subtitleExtra?: string;
}

export default function TxnRow({ expense, onPress, subtitleExtra }: Props) {
  const subtitle = `${expense.category} · ${formatDate(expense.date)}${subtitleExtra ? ` · ${subtitleExtra}` : ''}`;

  const content = (
    <View style={styles.row}>
      <View style={styles.icon}>
        <CategoryIcon category={expense.category} size={18} color={colors.accent} />
      </View>
      <View style={styles.main}>
        <Text style={styles.title} numberOfLines={1}>{expense.description}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
      </View>
      <Text style={styles.amount}>-{formatCurrency(expense.amount)}</Text>
    </View>
  );

  if (!onPress) return content;
  return <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  icon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  main: { flex: 1 },
  title: { color: colors.text, fontWeight: '600', fontSize: 14 },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  amount: { color: colors.danger, fontWeight: '700', fontSize: 14 },
});
