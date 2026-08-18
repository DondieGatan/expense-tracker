import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList,
  Alert, Platform,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Animated, { FadeInRight, FadeInDown, Layout } from 'react-native-reanimated';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../theme/colors';
import { api, API_BASE, getAccessToken } from '../api/client';
import { EXPENSE_CATEGORIES } from '../theme/constants';
import TxnRow from '../components/TxnRow';
import SwipeableRow from '../components/SwipeableRow';
import Skeleton from '../components/Skeleton';
import AnimatedPressable from '../components/AnimatedPressable';
import { SearchIcon, CategoryIcon, DownloadIcon, EmptyBoxIcon, PlusIcon } from '../components/icons';
import type { Expense } from '../api/types';

export default function ExpensesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation<any>();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const load = useCallback(async (q: string, cat: string | null, isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (cat) params.set('category', cat);
      const result = await api.get(`/expenses?${params.toString()}`);
      setExpenses(result.expenses);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          load(search, category);
        },
      },
    ]);
  };

  const onExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (category) params.set('category', category);
      const token = await getAccessToken();
      const res = await fetch(`${API_BASE}/expenses/export?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error('Export failed.');
      const csvText = await res.text();
      const filename = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;

      if (Platform.OS === 'web') {
        const blob = new Blob([csvText], { type: 'text/csv' });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(blobUrl);
      } else {
        const fileUri = `${FileSystem.cacheDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, csvText, { encoding: FileSystem.EncodingType.UTF8 });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export expenses' });
        }
      }
    } catch {
      Alert.alert('Export failed', 'Could not export your expenses. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const hasFilters = Boolean(search || category);

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Expenses</Text>
        <AnimatedPressable style={styles.exportBtn} onPress={onExport} disabled={exporting}>
          <DownloadIcon size={16} color={colors.text} />
        </AnimatedPressable>
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
        <View style={styles.list}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.skeletonRow}>
              <Skeleton width={40} height={40} borderRadius={12} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width="60%" height={14} />
                <Skeleton width="35%" height={11} />
              </View>
              <Skeleton width={60} height={14} />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={() => load(search, category, true)}
          ListEmptyComponent={
            <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <EmptyBoxIcon size={28} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>
                {hasFilters ? 'No matches' : 'No expenses yet'}
              </Text>
              <Text style={styles.emptyText}>
                {hasFilters
                  ? 'Try a different search term or category.'
                  : 'Log your first expense to start tracking your spending.'}
              </Text>
              {!hasFilters ? (
                <AnimatedPressable
                  style={styles.emptyButton}
                  onPress={() => navigation.getParent()?.navigate('ExpenseForm')}
                >
                  <PlusIcon size={14} color={colors.accentContrast} />
                  <Text style={styles.emptyButtonText}>Add expense</Text>
                </AnimatedPressable>
              ) : null}
            </Animated.View>
          }
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInRight.duration(350).delay(Math.min(index, 8) * 50)}
              layout={Layout.springify()}
              style={styles.row}
            >
              <SwipeableRow onDelete={() => onDelete(item.id, item.description)}>
                <AnimatedPressable
                  scaleTo={0.98}
                  style={styles.rowMain}
                  onPress={() => navigation.navigate('ExpenseForm', { expenseId: item.id })}
                >
                  <TxnRow expense={item} subtitleExtra={item.paymentMethod} />
                </AnimatedPressable>
              </SwipeableRow>
            </Animated.View>
          )}
        />
      )}
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, paddingBottom: 8,
  },
  pageTitle: { color: colors.text, fontSize: 22, fontWeight: '700' },
  exportBtn: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
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
  list: { padding: 20, paddingBottom: 100, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowMain: { flex: 1 },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptyText: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginBottom: 18 },
  emptyButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.accent, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 18,
  },
  emptyButtonText: { color: colors.accentContrast, fontWeight: '700', fontSize: 13 },
});
