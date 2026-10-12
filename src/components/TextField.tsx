import { useState, type Ref } from 'react';
import { Platform, Pressable, TextInput, View, type TextInputProps } from 'react-native';

import { Text } from '@/components/Text';
import { colors } from '@/design/colors';

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
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const border = error ? colors.danger : focused ? colors.accent : 'transparent';

  return (
    <View className="gap-2">
      <Text variant="footnote" style={{ color: colors.secondaryText }}>
        {label}
      </Text>
      <View
        className="h-14 flex-row items-center rounded-2xl bg-surface"
        style={{ borderWidth: 1.5, borderColor: border }}>
        <TextInput
          ref={ref}
          {...props}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          secureTextEntry={secure && !revealed}
          placeholderTextColor={colors.tertiaryText}
          selectionColor={colors.accent}
          allowFontScaling={false}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          className="h-full flex-1 px-4"
          // The browser's focus outline would draw a second, square ring
          // inside the rounded one.
          style={[{ color: colors.text, fontSize: 17 }, Platform.OS === 'web' && { outlineWidth: 0 }]}
        />
        {secure && (
          <Pressable
            onPress={() => setRevealed((r) => !r)}
            hitSlop={8}
            className="h-full justify-center px-4"
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}>
            <Text variant="subhead" style={{ color: colors.accent, fontWeight: '600' }}>
              {revealed ? 'Hide' : 'Show'}
            </Text>
          </Pressable>
        )}
      </View>
      {(error || hint) && (
        <Text
          variant="footnote"
          accessibilityLiveRegion={error ? 'polite' : 'none'}
          style={{ color: error ? colors.danger : colors.tertiaryText }}>
          {error ?? hint}
        </Text>
      )}
    </View>
  );
}
