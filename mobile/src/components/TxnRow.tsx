import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors, categoryColor, withAlpha } from '../theme/colors';
import { CategoryIcon } from './icons';
import { formatCurrency, formatDate } from '../utils/format';
import type { Expense } from '../api/types';

interface Props {
  expense: Expense;
  onPress?: () => void;
  subtitleExtra?: string;
  hideDate?: boolean;
}

export default function TxnRow({ expense, onPress, subtitleExtra, hideDate }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const tint = categoryColor(expense.category);
  const parts = [expense.category, hideDate ? null : formatDate(expense.date), subtitleExtra].filter(Boolean);

  const content = (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: withAlpha(tint, 0.16) }]}>
        <CategoryIcon category={expense.category} size={18} color={tint} />
      </View>
      <View style={styles.main}>
        <Text style={styles.title} numberOfLines={1}>{expense.description}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{parts.join(' · ')}</Text>
      </View>
      <Text style={styles.amount}>-{formatCurrency(expense.amount)}</Text>
    </View>
  );

  if (!onPress) return content;
  return <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity>;
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  icon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  main: { flex: 1 },
  title: { color: colors.text, fontWeight: '700', fontSize: 14 },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  amount: { color: colors.text, fontWeight: '800', fontSize: 14 },
});
