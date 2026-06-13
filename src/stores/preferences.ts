import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({ id: 'logmydance-prefs' });

export const preferences = {
  getTheme: (): string => storage.getString('theme') ?? 'system',
  setTheme: (v: 'light' | 'dark' | 'system'): void => storage.set('theme', v),

  getLanguage: (): string => storage.getString('language') ?? 'en',
  setLanguage: (v: string): void => storage.set('language', v),

  isOnboardingComplete: (): boolean =>
    storage.getBoolean('onboarding_completed') ?? false,
  setOnboardingComplete: (): void =>
    storage.set('onboarding_completed', true),
  resetOnboarding: (): void => storage.delete('onboarding_completed'),

  getAppOpens: (): number => storage.getNumber('app_opens_count') ?? 0,
  incrementAppOpens: (): void => {
    const current = storage.getNumber('app_opens_count') ?? 0;
    storage.set('app_opens_count', current + 1);
  },

  getInstallDate: (): string | undefined => storage.getString('install_date'),
  ensureInstallDate: (): void => {
    if (!storage.getString('install_date')) {
      storage.set('install_date', new Date().toISOString());
    }
  },
};
