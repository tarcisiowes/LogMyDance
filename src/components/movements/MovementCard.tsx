import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Footprints } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from './StatusBadge';
import type { MediaAsset, Movement, Style } from '@/types';

interface MovementCardProps {
  movement: Movement;
  style?: Style | null;
  thumbnail?: MediaAsset | null;
  stepCount?: number;
  onPress?: () => void;
}

export function MovementCard({ movement, style, thumbnail, stepCount = 0, onPress }: MovementCardProps) {
  return (
    <Card onPress={onPress} className="flex-row gap-3 p-0 overflow-hidden">
      {thumbnail ? (
        <Image
          source={{ uri: thumbnail.localPath }}
          style={{ width: 72, height: 72 }}
          contentFit="cover"
        />
      ) : (
        <View className="w-[72px] h-[72px] bg-neutral-800 items-center justify-center">
          <Text className="text-2xl">💃</Text>
        </View>
      )}
      <View className="flex-1 justify-center py-3 pr-3 gap-1.5">
        <View className="flex-row items-center justify-between gap-2">
          <Text className="text-neutral-100 text-base font-semibold flex-1" numberOfLines={1}>
            {movement.name}
          </Text>
          <StatusBadge status={movement.status as any} />
        </View>
        <View className="flex-row items-center gap-2">
          {style ? (
            <Text className="text-neutral-500 text-xs">
              {style.icon} {style.name}
            </Text>
          ) : null}
          {stepCount > 0 ? (
            <View className="flex-row items-center gap-1">
              <Footprints color="#fbbf24" size={12} />
              <Text className="text-amber-400 text-xs">{stepCount}</Text>
            </View>
          ) : null}
        </View>
        {movement.notes ? (
          <Text className="text-neutral-400 text-xs" numberOfLines={1}>
            {movement.notes}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}
