import React, { useState } from 'react';
import { LayoutChangeEvent, StyleProp, Text, TextStyle, View } from 'react-native';
import DisplayText from './DisplayText';

type Props = {
  children: string;
  // The widest string this will ever show (so the size does not jump while a number counts up). Defaults to children.
  fitTo?: string;
  maxSize: number;
  minSize?: number;
  display?: boolean;
  style?: StyleProp<TextStyle>;
};

// Shows one line of text at the largest size (up to maxSize) that fits the width it is given. Big money amounts used
// to wrap onto two lines on narrow phones ("AED 7,205.7" / "4"); adjustsFontSizeToFit alone does nothing on web, so
// the size is worked out from the measured width instead.
const GLYPH_WIDTH = 0.66; // average glyph width as a fraction of the font size, slightly generous for bold digits

export default function FitText({ children, fitTo, maxSize, minSize = 14, display = false, style }: Props) {
  const [width, setWidth] = useState(0);
  const chars = Math.max((fitTo ?? children).length, 1);
  const size = width > 0 ? Math.max(minSize, Math.min(maxSize, Math.floor(width / (chars * GLYPH_WIDTH)))) : maxSize;
  const Comp = display ? DisplayText : Text;
  return (
    <View style={{ alignSelf: 'stretch' }} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      <Comp style={[style, { fontSize: size }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {children}
      </Comp>
    </View>
  );
}
