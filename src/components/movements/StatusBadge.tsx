import { Text, View } from 'react-native';
import { getStatusInfo } from '@/constants/statuses';
import type { MovementStatus } from '@/types';

export function StatusBadge({ status }: { status: MovementStatus }) {
  const info = getStatusInfo(status);
  return (
    <View style={{ backgroundColor: info.bgColor }} className="px-2 py-0.5 rounded-full">
      <Text style={{ color: info.color }} className="text-xs font-medium">
        {info.label}
      </Text>
    </View>
  );
}
