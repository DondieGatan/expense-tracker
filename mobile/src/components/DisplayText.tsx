import React from 'react';
import { Platform, Text, TextProps } from 'react-native';

// Serif display type for page titles and big amounts. On web it picks up Fraunces (see useWebFont); on native it
// falls back to the platform serif, so no font files are bundled and the EAS build is untouched.
export default function DisplayText({ style, ...rest }: TextProps) {
  const extra: Record<string, unknown> = Platform.OS === 'web' ? { dataSet: { display: '1' } } : {};
  return <Text {...rest} {...extra} style={[{ fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }) }, style]} />;
}
