import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getStatusInfo } from '@/constants/statuses';
import { statusKey } from '@/i18n/labels';
import type { MovementStatus } from '@/types';

export function StatusBadge({ status }: { status: MovementStatus }) {
  const { t } = useTranslation();
  const info = getStatusInfo(status);
  return (
    <View style={{ backgroundColor: info.bgColor }} className="px-2 py-0.5 rounded-full">
      <Text style={{ color: info.color }} className="text-xs font-medium">
        {t(statusKey(status))}
      </Text>
    </View>
  );
}
