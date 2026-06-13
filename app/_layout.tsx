import '../global.css';
import '@/i18n';
import { useEffect } from 'react';
import { Stack, router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SQLiteProvider } from 'expo-sqlite';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { DbProvider, useDb } from '@/db/context';
import { initDatabase } from '@/db/setup';
import { mediaRepo } from '@/repositories/media';
import { preferences } from '@/stores/preferences';

function AppStartup() {
  const db = useDb();
  useEffect(() => {
    preferences.incrementAppOpens();
    // Silent orphan cleanup on each startup
    mediaRepo(db).cleanupOrphans().catch(() => {});
    if (!preferences.isOnboardingComplete()) {
      router.replace('/onboarding' as Href);
    }
  }, [db]);
  return null;
}

export default function RootLayout() {
  const { t } = useTranslation();

  return (
    <GestureHandlerRootView className="flex-1">
      <SQLiteProvider databaseName="logmydance.db" onInit={initDatabase}>
        <DbProvider>
          <AppStartup />
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: '#0a0a0a' },
              headerTintColor: '#f5f5f5',
              headerShadowVisible: false,
              contentStyle: { backgroundColor: '#0a0a0a' },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="entry/new"
              options={{ title: 'New Entry', presentation: 'modal' }}
            />
            <Stack.Screen
              name="entry/[id]"
              options={{ title: 'Entry', presentation: 'card' }}
            />
            <Stack.Screen
              name="movement/new"
              options={{ title: 'New Movement', presentation: 'modal' }}
            />
            <Stack.Screen
              name="movement/[id]"
              options={{ title: 'Movement', presentation: 'card' }}
            />
            <Stack.Screen
              name="template/new"
              options={{ title: 'New Template', presentation: 'modal' }}
            />
            <Stack.Screen
              name="template/[id]"
              options={{ title: 'Template', presentation: 'card' }}
            />
            <Stack.Screen
              name="tags"
              options={{ title: 'Manage Tags', presentation: 'modal' }}
            />
            <Stack.Screen
              name="storage"
              options={{ title: 'Storage & Backup', presentation: 'card' }}
            />
            <Stack.Screen
              name="settings"
              options={{ title: t('settings.title'), presentation: 'card' }}
            />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          </Stack>
        </DbProvider>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}
