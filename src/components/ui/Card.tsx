import { Pressable, View, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  onPress?: () => void;
  className?: string;
}

export function Card({ onPress, children, className = '', ...props }: CardProps) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={`bg-neutral-900 border border-neutral-800 rounded-2xl p-4 active:opacity-80 ${className}`}
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      className={`bg-neutral-900 border border-neutral-800 rounded-2xl p-4 ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
