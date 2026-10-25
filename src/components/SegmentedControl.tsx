import { Pressable, View } from 'react-native';

import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import * as haptics from '@/design/haptics';

type SegmentedControlProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Read by screen readers before each option, e.g. "Appearance". */
  accessibilityLabel: string;
};

// A row of mutually exclusive choices, like the system segmented control: the
// chosen one sits raised on the off-white track. Each segment is at least
// 44 dp tall. A selection haptic marks a change, never a repeat tap.
export function SegmentedControl<T extends string>({ options, value, onChange, accessibilityLabel }: SegmentedControlProps<T>) {
  const colors = useColors();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={{ flexDirection: 'row', gap: 3, padding: 3, borderRadius: 14, backgroundColor: colors.surface2 }}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              if (selected) return;
              haptics.selection();
              onChange(o.value);
            }}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={o.label}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 44,
              borderRadius: 11,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 8,
              backgroundColor: selected ? colors.surface : pressed ? colors.line : 'transparent',
              borderWidth: selected ? 1 : 0,
              borderColor: colors.line,
            })}>
            <Text
              variant="subhead"
              maxFontSizeMultiplier={1.3}
              numberOfLines={1}
              style={{ color: selected ? colors.ink : colors.ink2, fontWeight: selected ? '600' : '500' }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
