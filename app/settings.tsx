import { Linking, ScrollView, Text, View, Pressable } from 'react-native';
import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Check, ChevronRight, MessageSquare, RotateCcw } from 'lucide-react-native';
import Constants from 'expo-constants';
import { SUPPORTED_LANGUAGES, changeLanguage } from '@/i18n';
import { preferences } from '@/stores/preferences';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const current = i18n.language;
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const languageLabel = (lng: string) =>
    lng === 'pt-BR' ? t('settings.languagePortuguese') : t('settings.languageEnglish');

  const sendFeedback = () => {
    const email =
      (Constants.expoConfig?.extra as { feedbackEmail?: string } | undefined)?.feedbackEmail ?? '';
    const subject = encodeURIComponent('Log My Dance — feedback');
    Linking.openURL(`mailto:${email}?subject=${subject}`).catch(() => {});
  };

  const resetOnboarding = () => {
    preferences.resetOnboarding();
    router.replace('/onboarding' as Href);
  };

  return (
    <ScrollView
      className="flex-1 bg-neutral-950"
      contentContainerStyle={{ padding: 16, gap: 24 }}
    >
      <View className="gap-2">
        <Text className="text-neutral-400 text-sm font-medium uppercase tracking-wider">
          {t('settings.language')}
        </Text>
        <View className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          {SUPPORTED_LANGUAGES.map((lng, i) => {
            const active = current === lng;
            return (
              <Pressable
                key={lng}
                onPress={() => changeLanguage(lng)}
                className={`flex-row items-center justify-between px-4 py-3.5 active:bg-neutral-800 ${
                  i > 0 ? 'border-t border-neutral-800' : ''
                }`}
              >
                <Text className="text-neutral-100 text-base">
                  {languageLabel(lng)}
                </Text>
                {active ? <Check color="#a855f7" size={20} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-neutral-400 text-sm font-medium uppercase tracking-wider">
          {t('settings.beta')}
        </Text>
        <View className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          <Pressable
            onPress={sendFeedback}
            className="flex-row items-center gap-3 px-4 py-3.5 active:bg-neutral-800"
          >
            <MessageSquare color="#a855f7" size={20} />
            <Text className="text-neutral-100 text-base flex-1">{t('settings.sendFeedback')}</Text>
            <ChevronRight color="#525252" size={18} />
          </Pressable>
          <Pressable
            onPress={resetOnboarding}
            className="flex-row items-center gap-3 px-4 py-3.5 border-t border-neutral-800 active:bg-neutral-800"
          >
            <RotateCcw color="#a855f7" size={20} />
            <Text className="text-neutral-100 text-base flex-1">{t('settings.resetOnboarding')}</Text>
            <ChevronRight color="#525252" size={18} />
          </Pressable>
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-neutral-400 text-sm font-medium uppercase tracking-wider">
          {t('settings.about')}
        </Text>
        <View className="bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3.5 flex-row items-center justify-between">
          <Text className="text-neutral-100 text-base">{t('settings.version')}</Text>
          <Text className="text-neutral-500 text-base">{version}</Text>
        </View>
      </View>
    </ScrollView>
  );
}
