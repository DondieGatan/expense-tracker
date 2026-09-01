import { useEffect } from 'react';
import { Platform } from 'react-native';

const LINK_ID = 'auth-web-font';

// Loads Manrope from Google Fonts on web only — native (iOS/Android) keeps
// the system font entirely untouched, so this can't affect the EAS/Android
// build. Screens apply it via `fontFamily: webFontFamily`, which is
// undefined on native, so RN just falls through to its own default there.
export function useWebFont() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (document.getElementById(LINK_ID)) return;
    const link = document.createElement('link');
    link.id = LINK_ID;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap';
    document.head.appendChild(link);
  }, []);
}

export const webFontFamily = Platform.OS === 'web' ? "'Manrope', sans-serif" : undefined;
