import { useEffect } from 'react';
import { Platform } from 'react-native';

const LINK_ID = 'auth-web-font';
const STYLE_ID = 'app-web-font-style';

// Loads Manrope (body) and Fraunces (display: titles and big amounts) from Google Fonts on web only — native (iOS/Android) keeps
// the system font entirely untouched, so this can't affect the EAS/Android
// build. It also sets Manrope as the font for every text element on web (react-native-web renders Text as
// <div dir="auto">), so the whole app has one typeface instead of just the screens that opted in.
export function useWebFont() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!document.getElementById(LINK_ID)) {
      const link = document.createElement('link');
      link.id = LINK_ID;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap';
      document.head.appendChild(link);
    }
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent =
        "div[dir='auto']:not([data-display]), input, textarea, button { font-family: 'Manrope', system-ui, sans-serif !important; } " +
        "[data-display] { font-family: 'Fraunces', Georgia, serif !important; letter-spacing: -0.01em; }";
      document.head.appendChild(style);
    }
  }, []);
}

export const webFontFamily = Platform.OS === 'web' ? "'Manrope', sans-serif" : undefined;
