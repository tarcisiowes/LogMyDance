import { Text, View } from 'react-native';
import { Sparkles, type LucideIcon } from 'lucide-react-native';

interface EmptyStateProps {
  Icon?: LucideIcon;
  title: string;
  subtitle?: string;
}

export function EmptyState({ Icon = Sparkles, title, subtitle }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16 gap-4">
      <View className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 items-center justify-center">
        <Icon color="#737373" size={28} />
      </View>
      <View className="gap-1.5">
        <Text className="text-neutral-100 text-lg font-semibold text-center">{title}</Text>
        {subtitle ? (
          <Text className="text-neutral-500 text-sm text-center leading-5">{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}
