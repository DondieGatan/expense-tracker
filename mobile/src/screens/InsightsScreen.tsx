import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { Colors, categoryColor, withAlpha } from '../theme/colors';
import { api, ApiError } from '../api/client';
import { getInsights } from '../api/insights';
import { formatCurrency, todayIso } from '../utils/format';
import AuroraBackground from '../components/AuroraBackground';
import AnimatedPressable from '../components/AnimatedPressable';
import ProgressRing from '../components/ProgressRing';
import AiBadge from '../components/AiBadge';
import Skeleton from '../components/Skeleton';
import {
  SparklesIcon, AlertIcon, RepeatIcon, SendIcon, ArrowUpIcon, ArrowDownIcon, PlusIcon, EmptyBoxIcon,
} from '../components/icons';
import type { AskResult, Insights } from '../api/types';
import DisplayText from '../components/DisplayText';

interface ChatItem {
  id: number;
  question: string;
  result?: AskResult;
  error?: string;
}

const STARTERS = [
  'How much did I spend this month?',
  'What was my biggest expense last month?',
  'Which category costs me the most?',
  'How much budget do I have left?',
];

export default function InsightsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, insets.top), [colors, insets.top]);
  const navigation = useNavigation<any>();
  const scrollRef = useRef<ScrollView>(null);

  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [chat, setChat] = useState<ChatItem[]>([]);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setLoadError(null);
    try {
      setData(await getInsights(isRefresh));
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : 'Could not load your insights.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const ask = async (text: string) => {
    const clean = text.trim();
    if (clean.length < 3 || asking) return;
    const id = Date.now();
    setChat((prev) => [...prev, { id, question: clean }]);
    setQuestion('');
    setAsking(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    try {
      const result: AskResult = await api.post('/ai/ask', { question: clean, today: todayIso() });
      setChat((prev) => prev.map((c) => (c.id === id ? { ...c, result } : c)));
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Something went wrong. Please try again.';
      setChat((prev) => prev.map((c) => (c.id === id ? { ...c, error: message } : c)));
    } finally {
      setAsking(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    }
  };

  const header = (
    <View style={styles.headerRow}>
      <View style={{ flex: 1 }}>
        <DisplayText style={styles.pageTitle}>Insights</DisplayText>
        <Text style={styles.pageSubtitle}>{data ? data.monthLabel : 'Your spending, explained'}</Text>
      </View>
      {data ? <AiBadge source={data.source} /> : null}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.flex}>
        <AuroraBackground />
        <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
          {header}
          <Skeleton height={150} borderRadius={22} style={{ marginBottom: 14 }} />
          <Skeleton height={170} borderRadius={22} style={{ marginBottom: 14 }} />
          <Skeleton height={140} borderRadius={22} />
        </ScrollView>
      </View>
    );
  }

  if (loadError || !data) {
    return (
      <View style={styles.flex}>
        <AuroraBackground />
        <View style={styles.container}>
          {header}
          <View style={[styles.card, { alignItems: 'center' }]}>
            <Text style={styles.cardTitle}>Insights are taking a break</Text>
            <Text style={[styles.muted, { textAlign: 'center', marginVertical: 8 }]}>{loadError ?? 'Please try again.'}</Text>
            <AnimatedPressable style={styles.primaryBtn} onPress={() => { setLoading(true); load(); }}>
              <Text style={styles.primaryBtnText}>Try again</Text>
            </AnimatedPressable>
          </View>
        </View>
      </View>
    );
  }

  const month = data.thisMonth;
  const budget = data.budget;
  const ringPercent = budget ? budget.usedPercent : (month.daysElapsed / month.daysInMonth) * 100;
  const change = month.changeVsLastMonthPercent;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AuroraBackground />
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.accent} />}
      >
        {header}

        {!data.hasData || month.expenseCount === 0 ? (
          <Animated.View entering={FadeInDown.duration(450)} style={[styles.card, { alignItems: 'center', paddingVertical: 30 }]}>
            <View style={styles.emptyIcon}><EmptyBoxIcon size={26} color={colors.textMuted} /></View>
            <Text style={styles.cardTitle}>Nothing to analyse yet</Text>
            <Text style={[styles.muted, { textAlign: 'center', marginVertical: 8 }]}>{data.headline}</Text>
            <AnimatedPressable style={styles.primaryBtn} onPress={() => navigation.getParent()?.navigate('ExpenseForm')}>
              <PlusIcon size={14} color={colors.accentContrast} />
              <Text style={styles.primaryBtnText}>Add expense</Text>
            </AnimatedPressable>
          </Animated.View>
        ) : (
          <>
            <Animated.View entering={FadeInDown.duration(450)}>
              <LinearGradient colors={[colors.aiFrom, colors.aiTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.coach}>
                <View style={styles.coachHead}>
                  <View style={styles.coachIcon}><SparklesIcon size={18} color={colors.accent} /></View>
                  <Text style={styles.coachLabel}>This month in a sentence</Text>
                </View>
                <Text style={styles.headline}>{data.headline}</Text>
                {data.tips.map((tip, i) => (
                  <View key={i} style={styles.tipRow}>
                    <View style={styles.tipDot} />
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </LinearGradient>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(450).delay(60)} style={styles.card}>
              <Text style={styles.cardTitle}>Pace</Text>
              <View style={styles.paceRow}>
                <ProgressRing
                  percent={ringPercent}
                  size={118}
                  thickness={12}
                  over={budget ? !budget.onTrack && budget.remaining <= 0 : false}
                  label={`${Math.round(ringPercent)}%`}
                  sublabel={budget ? 'of budget' : 'of month'}
                />
                <View style={styles.paceStats}>
                  <Stat styles={styles} label="Projected by month end" value={formatCurrency(month.projected)} warn={!!budget && !budget.onTrack} />
                  <Stat styles={styles} label="Everyday spending per day" value={formatCurrency(month.dailyAverage)} />
                  {budget ? (
                    <Stat styles={styles} label={budget.remaining > 0 ? 'Safe to spend per day' : 'Over budget by'} value={formatCurrency(budget.remaining > 0 ? budget.safeDailySpend : Math.abs(budget.remaining))} />
                  ) : null}
                </View>
              </View>
              {change !== null ? (
                <View style={styles.changeRow}>
                  {change > 0 ? <ArrowUpIcon size={14} color={colors.danger} /> : <ArrowDownIcon size={14} color={colors.success} />}
                  <Text style={styles.changeText}>
                    <Text style={{ fontWeight: '800', color: change > 0 ? colors.danger : colors.success }}>{Math.abs(change).toFixed(0)}% {change > 0 ? 'more' : 'less'}</Text>
                    {' '}than the same days last month ({formatCurrency(month.lastMonthSamePeriod)})
                  </Text>
                </View>
              ) : null}
            </Animated.View>

            {data.categories.length ? (
              <Animated.View entering={FadeInDown.duration(450).delay(100)} style={styles.card}>
                <Text style={styles.cardTitle}>Categories vs last month</Text>
                {data.categories.map((c) => (
                  <View key={c.category} style={styles.catRow}>
                    <View style={[styles.catDot, { backgroundColor: categoryColor(c.category) }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.catName}>{c.category}</Text>
                      <View style={styles.catTrack}>
                        <View style={[styles.catFill, { width: `${Math.max(c.share, 3)}%`, backgroundColor: categoryColor(c.category) }]} />
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.catAmount}>{formatCurrency(c.total)}</Text>
                      {c.changePercent !== null ? (
                        <Text style={[styles.catChange, { color: c.changePercent > 0 ? colors.danger : colors.success }]}>
                          {c.changePercent > 0 ? '▲' : '▼'} {Math.abs(c.changePercent) > 999 ? '999%+' : `${Math.abs(c.changePercent).toFixed(0)}%`}
                        </Text>
                      ) : (
                        <Text style={[styles.catChange, { color: colors.textMuted }]}>new</Text>
                      )}
                    </View>
                  </View>
                ))}
              </Animated.View>
            ) : null}

            {data.unusual.length ? (
              <Animated.View entering={FadeInDown.duration(450).delay(140)} style={styles.card}>
                <View style={styles.cardTitleRow}>
                  <AlertIcon size={16} color={colors.warn} />
                  <Text style={styles.cardTitle}>Worth a look</Text>
                </View>
                {data.unusual.map((u) => (
                  <AnimatedPressable
                    key={u.id}
                    scaleTo={0.98}
                    style={styles.listRow}
                    onPress={() => navigation.getParent()?.navigate('ExpenseForm', { expenseId: u.id })}
                  >
                    <View style={[styles.listIcon, { backgroundColor: withAlpha(colors.warn, 0.16) }]}>
                      <AlertIcon size={16} color={colors.warn} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listTitle} numberOfLines={1}>{u.description}</Text>
                      <Text style={styles.muted}>
                        {formatCurrency(u.amount)} is {u.timesTypical}× your usual {u.category} expense ({formatCurrency(u.typical)})
                      </Text>
                    </View>
                  </AnimatedPressable>
                ))}
              </Animated.View>
            ) : null}

            {data.recurring.length ? (
              <Animated.View entering={FadeInDown.duration(450).delay(180)} style={styles.card}>
                <View style={styles.cardTitleRow}>
                  <RepeatIcon size={16} color={colors.accent2} />
                  <Text style={styles.cardTitle}>Repeating charges</Text>
                </View>
                {data.recurring.map((r) => (
                  <View key={r.description} style={styles.listRow}>
                    <View style={[styles.listIcon, { backgroundColor: withAlpha(colors.accent2, 0.16) }]}>
                      <RepeatIcon size={16} color={colors.accent2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listTitle} numberOfLines={1}>{r.description}</Text>
                      <Text style={styles.muted}>{r.category} · seen in {r.months} months</Text>
                    </View>
                    <Text style={styles.catAmount}>{formatCurrency(r.amount)}</Text>
                  </View>
                ))}
                <Text style={[styles.muted, { marginTop: 8 }]}>About {formatCurrency(data.recurringMonthlyTotal)} a month in total.</Text>
              </Animated.View>
            ) : null}
          </>
        )}

        <Animated.View entering={FadeInDown.duration(450).delay(220)} style={styles.card}>
          <View style={styles.cardTitleRow}>
            <SparklesIcon size={16} color={colors.accent} />
            <Text style={styles.cardTitle}>Ask about your spending</Text>
          </View>
          <Text style={[styles.muted, { marginBottom: 10 }]}>
            Totals and comparisons are calculated exactly from your expenses. Open questions go to the AI.
          </Text>

          {chat.map((item) => (
            <Animated.View key={item.id} entering={FadeIn.duration(300)} style={{ marginBottom: 12 }}>
              <View style={styles.bubbleUser}><Text style={styles.bubbleUserText}>{item.question}</Text></View>
              {item.result ? (
                <View style={styles.bubbleAi}>
                  <Text style={styles.bubbleAiText}>{item.result.answer}</Text>
                  {item.result.suggestions?.map((s) => (
                    <AnimatedPressable key={s} scaleTo={0.97} style={styles.suggestionInBubble} onPress={() => ask(s)}>
                      <Text style={styles.suggestionText}>{s}</Text>
                    </AnimatedPressable>
                  ))}
                  <View style={{ marginTop: 6, alignSelf: 'flex-start' }}><AiBadge source={item.result.source} /></View>
                </View>
              ) : item.error ? (
                <View style={styles.bubbleAi}><Text style={[styles.bubbleAiText, { color: colors.danger }]}>{item.error}</Text></View>
              ) : (
                <View style={styles.bubbleAi}><ActivityIndicator size="small" color={colors.accent} /></View>
              )}
            </Animated.View>
          ))}

          {chat.length === 0 ? (
            <View style={styles.starters}>
              {STARTERS.map((s) => (
                <AnimatedPressable key={s} scaleTo={0.96} style={styles.starter} onPress={() => ask(s)}>
                  <Text style={styles.starterText}>{s}</Text>
                </AnimatedPressable>
              ))}
            </View>
          ) : null}

          <View style={styles.askRow}>
            <TextInput
              style={styles.askInput}
              placeholder="e.g. How much did I spend on coffee?"
              placeholderTextColor={colors.textMuted}
              value={question}
              onChangeText={setQuestion}
              onSubmitEditing={() => ask(question)}
              returnKeyType="send"
              maxLength={300}
            />
            <AnimatedPressable
              style={[styles.sendBtn, (asking || question.trim().length < 3) && { opacity: 0.5 }]}
              onPress={() => ask(question)}
              disabled={asking || question.trim().length < 3}
              accessibilityLabel="Ask"
            >
              {asking ? <ActivityIndicator size="small" color={colors.accentContrast} /> : <SendIcon size={16} color={colors.accentContrast} />}
            </AnimatedPressable>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Stat({ styles, label, value, warn }: { styles: ReturnType<typeof makeStyles>; label: string; value: string; warn?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, warn && styles.statWarn]}>{value}</Text>
    </View>
  );
}

const makeStyles = (colors: Colors, topInset: number) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 20, paddingTop: 16 + topInset, paddingBottom: 130 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  pageTitle: { color: colors.text, fontSize: 26, fontWeight: '800' },
  pageSubtitle: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  muted: { color: colors.textMuted, fontSize: 12.5, lineHeight: 17 },
  card: { backgroundColor: colors.surface, borderRadius: 22, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  cardTitle: { color: colors.text, fontSize: 15, fontWeight: '800', marginBottom: 8 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  coach: { borderRadius: 24, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: withAlpha(colors.accent, 0.3) },
  coachHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  coachIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: withAlpha(colors.accent, 0.18), alignItems: 'center', justifyContent: 'center' },
  coachLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  headline: { color: colors.text, fontSize: 18, fontWeight: '800', lineHeight: 25, marginBottom: 12 },
  tipRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  tipDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent2, marginTop: 7 },
  tipText: { flex: 1, color: colors.text, fontSize: 13.5, lineHeight: 20 },
  paceRow: { flexDirection: 'row', alignItems: 'center', gap: 18, flexWrap: 'wrap' },
  paceStats: { flex: 1, minWidth: 150, gap: 12 },
  stat: {},
  statLabel: { color: colors.textMuted, fontSize: 11.5 },
  statValue: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 1 },
  statWarn: { color: colors.danger },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border },
  changeText: { flex: 1, color: colors.textMuted, fontSize: 12.5, lineHeight: 17 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catName: { color: colors.text, fontSize: 13.5, fontWeight: '700', marginBottom: 5 },
  catTrack: { height: 5, borderRadius: 999, backgroundColor: colors.surface2, overflow: 'hidden' },
  catFill: { height: '100%', borderRadius: 999 },
  catAmount: { color: colors.text, fontSize: 13.5, fontWeight: '800' },
  catChange: { fontSize: 11.5, fontWeight: '800', marginTop: 2 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  listIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  listTitle: { color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  emptyIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.accent, borderRadius: 999, paddingVertical: 11, paddingHorizontal: 20 },
  primaryBtnText: { color: colors.accentContrast, fontWeight: '800', fontSize: 13.5 },
  starters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  starter: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  starterText: { color: colors.text, fontSize: 12.5, fontWeight: '600' },
  bubbleUser: { alignSelf: 'flex-end', maxWidth: '85%', backgroundColor: colors.accent, borderRadius: 18, borderBottomRightRadius: 6, paddingVertical: 9, paddingHorizontal: 14, marginBottom: 8 },
  bubbleUserText: { color: colors.accentContrast, fontSize: 13.5, fontWeight: '600' },
  bubbleAi: { alignSelf: 'flex-start', maxWidth: '92%', backgroundColor: colors.surface2, borderRadius: 18, borderBottomLeftRadius: 6, paddingVertical: 10, paddingHorizontal: 14 },
  bubbleAiText: { color: colors.text, fontSize: 13.5, lineHeight: 19 },
  suggestionInBubble: { marginTop: 8, paddingVertical: 7, paddingHorizontal: 11, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  suggestionText: { color: colors.accent, fontSize: 12.5, fontWeight: '700' },
  askRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  askInput: {
    flex: 1, backgroundColor: colors.bg, borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    color: colors.text, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
});
