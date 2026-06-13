import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PRIVACY_POLICY } from '@/content/privacy';

export default function PrivacyScreen() {
  const { i18n } = useTranslation();
  const doc = i18n.language === 'pt-BR' ? PRIVACY_POLICY['pt-BR'] : PRIVACY_POLICY.en;

  return (
    <ScrollView
      className="flex-1 bg-neutral-950"
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
    >
      <Text className="text-neutral-500 text-xs">{doc.updated}</Text>
      <Text className="text-neutral-200 text-base leading-6">{doc.intro}</Text>

      {doc.sections.map((section) => (
        <View key={section.heading} className="gap-1.5">
          <Text className="text-neutral-100 text-base font-semibold">{section.heading}</Text>
          <Text className="text-neutral-400 text-sm leading-6">{section.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
