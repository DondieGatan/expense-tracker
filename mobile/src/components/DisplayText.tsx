import React from 'react';
import { Platform, Text, TextProps } from 'react-native';

// Display type for page titles and big amounts: tightly tracked, heavy grotesque. On web it picks up Inter Tight (see
// useWebFont); on native it keeps the platform font with tighter tracking, so no font files are bundled and the EAS
// build is untouched.
export default function DisplayText({ style, ...rest }: TextProps) {
  const extra: Record<string, unknown> = Platform.OS === 'web' ? { dataSet: { display: '1' } } : {};
  return <Text {...rest} {...extra} style={[{ letterSpacing: -0.6 }, style]} />;
}
