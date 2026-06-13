import { Text, TextInput, View, type TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <View className="gap-1">
      {label ? (
        <Text className="text-sm font-medium text-neutral-400">{label}</Text>
      ) : null}
      <TextInput
        className={`bg-neutral-800 border ${error ? 'border-red-500' : 'border-neutral-700'} rounded-xl px-4 py-3 text-neutral-100 text-base placeholder:text-neutral-500 ${className}`}
        placeholderTextColor="#737373"
        {...props}
      />
      {error ? (
        <Text className="text-xs text-red-400">{error}</Text>
      ) : null}
    </View>
  );
}
