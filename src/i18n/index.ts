import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { storage } from '@/stores/preferences';
import { en } from './locales/en';
import { ptBR } from './locales/pt-BR';

export const SUPPORTED_LANGUAGES = ['en', 'pt-BR'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const resources = {
  en: { translation: en },
  'pt-BR': { translation: ptBR },
};

function isSupported(lng: string): lng is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(lng);
}

/** Saved preference wins; otherwise fall back to the device locale, then English. */
function detectLanguage(): SupportedLanguage {
  const saved = storage.getString('language');
  if (saved && isSupported(saved)) return saved;

  try {
    const locale = getLocales()[0];
    if (locale?.languageTag === 'pt-BR' || locale?.languageCode === 'pt') {
      return 'pt-BR';
    }
  } catch {
    // Native module unavailable (e.g. web) — fall through to default.
  }
  return 'en';
}

i18n.use(initReactI18next).init({
  resources,
  lng: detectLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export function changeLanguage(lng: SupportedLanguage): void {
  storage.set('language', lng);
  i18n.changeLanguage(lng);
}

export function getLanguage(): SupportedLanguage {
  return isSupported(i18n.language) ? i18n.language : 'en';
}

export default i18n;
