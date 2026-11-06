import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import GlowBlob from './GlowBlob';

// Two soft colour glows behind a screen's content: the quiet depth that makes the flat dark/light backgrounds
// feel designed. Purely decorative (no touches, hidden from screen readers).
export default function AuroraBackground() {
  const { colors, isDark } = useTheme();
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <GlowBlob size={340} color={colors.heroFrom} style={[styles.blob, styles.topRight, { opacity: isDark ? 0.6 : 0.22 }]} />
      <GlowBlob size={280} color={isDark ? '#4b66f0' : colors.accent2} style={[styles.blob, styles.midLeft, { opacity: isDark ? 0.3 : 0.12 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: { position: 'absolute' },
  topRight: { top: -120, right: -110 },
  midLeft: { top: 260, left: -170 },
});
