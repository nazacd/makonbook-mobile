import { Platform, TextInput } from 'react-native';

type GridInInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function GridInInput({ value, onChange }: GridInInputProps) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder="Enter a number or fraction (e.g. 1/2)"
      placeholderTextColor="#9ca3af"
      keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
      className="rounded-xl border border-neutral-300 px-4 py-3 text-base text-black dark:border-neutral-700 dark:text-white"
    />
  );
}
