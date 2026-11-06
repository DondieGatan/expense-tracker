import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { withAlpha } from '../theme/colors';
import { SparklesIcon } from './icons';

interface Props {
  // 'ai' = written by the language model, 'rules' = calculated / rule-based (always correct, no model involved)
  source: 'ai' | 'rules' | 'calculated' | 'unavailable';
}

const LABELS = { ai: 'AI', rules: 'Smart rules', calculated: 'Calculated', unavailable: 'Unavailable' } as const;

// A small honest label on every AI-looking result: it says whether a model wrote it or it was calculated.
export default function AiBadge({ source }: Props) {
  const { colors } = useTheme();
  const tone = source === 'ai' ? colors.accent : source === 'unavailable' ? colors.warn : colors.accent2;
  return (
    <View style={[styles.pill, { backgroundColor: withAlpha(tone, 0.14), borderColor: withAlpha(tone, 0.35) }]}>
      <SparklesIcon size={11} color={tone} />
      <Text style={[styles.text, { color: tone }]}>{LABELS[source]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999, borderWidth: 1 },
  text: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
});
