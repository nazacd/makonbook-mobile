import { ActivityIndicator, View, type StyleProp, type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { Text } from '@/components/Text';
import { colors } from '@/design/colors';

type Variant = 'primary' | 'secondary' | 'plain' | 'destructive';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  /** Shows a spinner in place of the label and ignores presses. */
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

const SURFACE: Record<Variant, string> = {
  primary: 'h-14 items-center justify-center rounded-2xl bg-accent px-6',
  secondary: 'h-14 items-center justify-center rounded-2xl bg-surface px-6',
  plain: 'h-11 items-center justify-center rounded-xl px-4',
  destructive: 'h-11 items-center justify-center rounded-xl px-4',
};

const LABEL_COLOR: Record<Variant, string> = {
  primary: colors.text,
  secondary: colors.text,
  plain: colors.accent,
  destructive: colors.danger,
};

// Accent is reserved for what can be tapped; a near-black button on the
// near-black background would be invisible (see AGENTS.md, Design system).
export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  accessibilityHint,
}: ButtonProps) {
  const inactive = disabled || loading;
  return (
    <PressableScale
      onPress={onPress}
      disabled={inactive}
      className={disabled ? `${SURFACE[variant]} opacity-40` : SURFACE[variant]}
      style={style}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}>
      {/* The label keeps its space while loading so the button never changes
          size under the finger. */}
      <View>
        <Text
          variant="headline"
          style={{ color: LABEL_COLOR[variant], opacity: loading ? 0 : 1, textAlign: 'center' }}>
          {label}
        </Text>
        {loading && (
          <View className="absolute inset-0 items-center justify-center">
            <ActivityIndicator color={LABEL_COLOR[variant]} />
          </View>
        )}
      </View>
    </PressableScale>
  );
}
