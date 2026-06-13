import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BookOpen, Dumbbell, LayoutTemplate, BarChart2 } from 'lucide-react-native';

export default function TabLayout() {
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#0a0a0a' },
        headerTintColor: '#f5f5f5',
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: '#0a0a0a',
          borderTopColor: '#262626',
        },
        tabBarActiveTintColor: '#a855f7',
        tabBarInactiveTintColor: '#737373',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.journal'),
          tabBarIcon: ({ color, size }) => (
            <BookOpen color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="movements"
        options={{
          title: t('tabs.movements'),
          tabBarIcon: ({ color, size }) => (
            <Dumbbell color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="templates"
        options={{
          title: t('tabs.templates'),
          tabBarIcon: ({ color, size }) => (
            <LayoutTemplate color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: t('tabs.stats'),
          tabBarIcon: ({ color, size }) => (
            <BarChart2 color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
