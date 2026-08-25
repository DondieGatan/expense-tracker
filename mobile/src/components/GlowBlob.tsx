import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';

interface Props {
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
}

export default function GlowBlob({ size = 220, color, style }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 220 220" style={style} pointerEvents="none">
      <Defs>
        <RadialGradient id="glow" cx="35%" cy="30%" r="65%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.55} />
          <Stop offset="55%" stopColor={color} stopOpacity={0.16} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={110} cy={110} r={110} fill="url(#glow)" />
    </Svg>
  );
}
