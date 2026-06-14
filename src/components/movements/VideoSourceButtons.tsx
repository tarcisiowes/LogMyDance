import type { ComponentType } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Camera, Images, FolderOpen } from 'lucide-react-native';
import type { VideoSource } from '@/services/video-import';

interface VideoSourceButtonsProps {
  onPick: (source: VideoSource) => void;
  disabled?: boolean;
}

type IconType = ComponentType<{ color?: string; size?: number }>;

function SourceButton({
  Icon,
  label,
  onPress,
  disabled,
}: {
  Icon: IconType;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`flex-1 items-center gap-2 py-4 rounded-2xl border border-dashed border-neutral-700 active:border-violet-500 active:bg-neutral-900 ${
        disabled ? 'opacity-40' : ''
      }`}
    >
      <Icon color="#a855f7" size={24} />
      <Text className="text-neutral-300 text-xs">{label}</Text>
    </Pressable>
  );
}

/** Three-way video source chooser: record (camera), gallery, or file browser. */
export function VideoSourceButtons({ onPick, disabled }: VideoSourceButtonsProps) {
  const { t } = useTranslation();
  return (
    <View className="flex-row gap-2">
      <SourceButton Icon={Camera} label={t('video.record')} onPress={() => onPick('camera')} disabled={disabled} />
      <SourceButton Icon={Images} label={t('video.gallery')} onPress={() => onPick('library')} disabled={disabled} />
      <SourceButton Icon={FolderOpen} label={t('video.files')} onPress={() => onPick('files')} disabled={disabled} />
    </View>
  );
}
