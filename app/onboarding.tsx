import { useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { preferences } from '@/stores/preferences';

const { width } = Dimensions.get('window');

const SLIDES = [
  { emoji: '📖', titleKey: 'onboarding.slide1Title', bodyKey: 'onboarding.slide1Body' },
  { emoji: '💪', titleKey: 'onboarding.slide2Title', bodyKey: 'onboarding.slide2Body' },
  { emoji: '🔒', titleKey: 'onboarding.slide3Title', bodyKey: 'onboarding.slide3Body' },
] as const;

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  function finish() {
    preferences.setOnboardingComplete();
    router.replace('/(tabs)' as Href);
  }

  function next() {
    if (isLast) {
      finish();
      return;
    }
    scrollRef.current?.scrollTo({ x: width * (index + 1), animated: true });
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-950">
      <View className="items-end px-5 pt-2">
        <Pressable onPress={finish} className="px-3 py-2 active:opacity-60">
          <Text className="text-neutral-400 text-base">{t('onboarding.skip')}</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        className="flex-1"
      >
        {SLIDES.map((slide) => (
          <View
            key={slide.titleKey}
            style={{ width }}
            className="flex-1 items-center justify-center px-10"
          >
            <Text className="text-8xl mb-8">{slide.emoji}</Text>
            <Text className="text-neutral-50 text-3xl font-bold text-center mb-4">
              {t(slide.titleKey)}
            </Text>
            <Text className="text-neutral-400 text-base text-center leading-6">
              {t(slide.bodyKey)}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View className="flex-row justify-center gap-2 mb-6">
        {SLIDES.map((slide, i) => (
          <View
            key={slide.titleKey}
            className={`h-2 rounded-full ${
              i === index ? 'w-6 bg-violet-500' : 'w-2 bg-neutral-700'
            }`}
          />
        ))}
      </View>

      <View className="px-6 pb-4">
        <Button
          onPress={next}
          label={isLast ? t('onboarding.getStarted') : t('onboarding.next')}
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}
