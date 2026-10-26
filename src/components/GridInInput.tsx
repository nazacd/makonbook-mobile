import { Platform, TextInput } from "react-native";

import { useColors } from "@/design/colors";

type GridInInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function GridInInput({ value, onChange }: GridInInputProps) {
  const colors = useColors();
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      // Part of the timed test, which is laid out for fixed sizes.
      allowFontScaling={false}
      placeholder="Enter a number or fraction (e.g. 1/2)"
      placeholderTextColor={colors.ink3}
      keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "default"}
      className="rounded-xl border border-line bg-surface py-3 text-base text-ink"
      style={{ paddingHorizontal: 15 }}
    />
  );
}
