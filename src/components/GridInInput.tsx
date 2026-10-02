import { Platform, TextInput } from "react-native";

type GridInInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function GridInInput({ value, onChange }: GridInInputProps) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      // Same reason as src/components/Text.tsx: avoid font-scale
      // measure/draw mismatches after a configuration change.
      allowFontScaling={false}
      placeholder="Enter a number or fraction (e.g. 1/2)"
      placeholderTextColor="#6b7280"
      keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "default"}
      className="rounded-xl border border-white/10 bg-surface py-3 text-base text-white"
      style={{ paddingHorizontal: 15 }}
    />
  );
}
