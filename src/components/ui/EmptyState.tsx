import { Text, View } from 'react-native';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ emoji = '💃', title, subtitle }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16 gap-3">
      <Text className="text-5xl">{emoji}</Text>
      <Text className="text-neutral-100 text-lg font-semibold text-center">{title}</Text>
      {subtitle ? (
        <Text className="text-neutral-500 text-sm text-center">{subtitle}</Text>
      ) : null}
    </View>
  );
}
