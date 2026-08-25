import { useEffect } from 'react';
import { Platform } from 'react-native';

const STYLE_ID = 'autofill-fix';

// Chrome/Edge force a light background on autofilled inputs that no RN style
// prop can override — this is the standard inset-box-shadow workaround,
// injected only on web and kept in sync with the current theme's colors.
export function useWebAutofillFix(background: string, textColor: string) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ID;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      input:-webkit-autofill,
      input:-webkit-autofill:hover,
      input:-webkit-autofill:focus {
        -webkit-box-shadow: 0 0 0px 1000px ${background} inset !important;
        -webkit-text-fill-color: ${textColor} !important;
        caret-color: ${textColor};
        transition: background-color 9999s ease-in-out 0s;
      }
    `;
  }, [background, textColor]);
}
