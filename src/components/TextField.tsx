import { useState, type Ref } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';

type TextFieldProps = Omit<TextInputProps, 'style' | 'placeholderTextColor' | 'secureTextEntry'> & {
  label: string;
  /** Shown under the field, in place of the hint. */
  error?: string | null;
  hint?: string;
  /** A password field, with a Show/Hide control. */
  secure?: boolean;
  ref?: Ref<TextInput>;
};

export function TextField({ label, error, hint, secure = false, ref, onFocus, onBlur, ...props }: TextFieldProps) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const border = error ? colors.bad : focused ? colors.accent : 'transparent';

  return (
    <View className="gap-2">
      <Text variant="footnote" style={{ color: colors.ink2 }}>
        {label}
      </Text>
      <View
        className="h-14 flex-row items-center overflow-hidden rounded-2xl bg-surface"
        style={{ borderWidth: 1.5, borderColor: border }}>
        <TextInput
          ref={ref}
          {...props}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          secureTextEntry={secure && !revealed}
          placeholderTextColor={colors.ink3}
          selectionColor={colors.accent}
          maxFontSizeMultiplier={1.4}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          // Layout as a plain style, not classes: on Android the padding
          // classes didn't reach the native input and text sat against the
          // left edge. minWidth 0 lets the input shrink to leave room for the
          // eye button. On web, the browser's focus outline would draw a
          // second, square ring.
          style={[styles.input, { color: colors.ink }, Platform.OS === 'web' && { outlineWidth: 0 }]}
        />
        {secure && (
          <Pressable
            onPress={() => setRevealed((r) => !r)}
            className="h-full w-14 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}>
            {/* The icon shows what a tap does: an open eye reveals, a struck
                eye hides again. */}
            {({ pressed }) => (
              <Icon as={revealed ? EyeOff : Eye} size={22} color={pressed ? colors.ink : colors.ink2} />
            )}
          </Pressable>
        )}
      </View>
      {(error || hint) && (
        <Text
          variant="footnote"
          accessibilityLiveRegion={error ? 'polite' : 'none'}
          style={{ color: error ? colors.bad : colors.ink3 }}>
          {error ?? hint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    flex: 1,
    alignSelf: 'stretch',
    minWidth: 0,
    paddingHorizontal: 16,
    // Android adds its own vertical padding, which pushes the text off-centre.
    paddingVertical: 0,
    fontSize: 17,
  },
});
