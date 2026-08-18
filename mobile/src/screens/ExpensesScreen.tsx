import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList,
  ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Animated, { FadeInRight, FadeInDown, Layout } from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { api } from '../api/client';
import { EXPENSE_CATEGORIES } from '../theme/constants';
import TxnRow from '../components/TxnRow';
import AnimatedPressable from '../components/AnimatedPressable';
import { SearchIcon, TrashIcon, CategoryIcon } from '../components/icons';
import type { Expense } from '../api/types';

export default function ExpensesScreen() {
  const navigation = useNavigation<any>();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const load = useCallback(async (q: string, cat: string | null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (cat) params.set('category', cat);
      const result = await api.get(`/expenses?${params.toString()}`);
      setExpenses(result.expenses);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(search, category);
    }, [load, search, category])
  );

  const onDelete = (id: number, description: string) => {
    Alert.alert('Delete expense', `Delete "${description}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await api.delete(`/expenses/${id}`);
          load(search, category);
        },
      },
    ]);
  };

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Expenses</Text>
      </View>

      <View style={styles.searchBar}>
        <SearchIcon size={16} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by description…"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => load(search, category)}
        />
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filters}
        contentContainerStyle={styles.filtersContent}
        data={['All', ...EXPENSE_CATEGORIES]}
        keyExtractor={(item) => item}
        renderItem={({ item, index }) => {
          const value = item === 'All' ? null : item;
          const active = category === value;
          return (
            <Animated.View entering={FadeInDown.duration(350).delay(index * 30)}>
              <AnimatedPressable
                scaleTo={0.92}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setCategory(value)}
              >
                {value ? (
                  <CategoryIcon category={value} size={13} color={active ? colors.accentContrast : colors.textMuted} />
                ) : null}
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{item}</Text>
              </AnimatedPressable>
            </Animated.View>
          );
        }}
      />

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>No expenses match your filters.</Text>}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInRight.duration(350).delay(Math.min(index, 8) * 50)}
              layout={Layout.springify()}
              style={styles.row}
            >
              <AnimatedPressable
                scaleTo={0.98}
                style={styles.rowMain}
                onPress={() => navigation.navigate('ExpenseForm', { expenseId: item.id })}
              >
                <TxnRow expense={item} subtitleExtra={item.paymentMethod} />
              </AnimatedPressable>
              <AnimatedPressable style={styles.deleteBtn} onPress={() => onDelete(item.id, item.description)}>
                <TrashIcon size={16} color={colors.danger} />
              </AnimatedPressable>
            </Animated.View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  header: { padding: 20, paddingBottom: 8 },
  pageTitle: { color: colors.text, fontSize: 22, fontWeight: '700' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20,
    backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, color: colors.text, paddingVertical: 10, fontSize: 14 },
  filters: { marginTop: 12, flexGrow: 0 },
  filtersContent: { paddingHorizontal: 20, gap: 8 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999,
    backgroundColor: colors.surface2, marginRight: 8,
  },
  filterChipActive: { backgroundColor: colors.accent },
  filterChipText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  filterChipTextActive: { color: colors.accentContrast },
  list: { padding: 20, paddingBottom: 100 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowMain: { flex: 1 },
  deleteBtn: { padding: 10 },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
});
