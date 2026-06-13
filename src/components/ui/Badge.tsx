import { Text, View } from 'react-native';

interface BadgeProps {
  label: string;
  color?: string;
  bgColor?: string;
}

export function Badge({ label, color = '#a1a1aa', bgColor = '#27272a' }: BadgeProps) {
  return (
    <View
      style={{ backgroundColor: bgColor }}
      className="px-2 py-0.5 rounded-full"
    >
      <Text style={{ color }} className="text-xs font-medium">
        {label}
      </Text>
    </View>
  );
}
