import { ActivityIndicator, View, type StyleProp, type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { Text } from '@/components/Text';
import { useColors, type Palette } from '@/design/colors';

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

// Heights in dp, not classes: NativeWind's rem is 14 px on native and 16 on web.
const SURFACE: Record<Variant, { className: string; height: number }> = {
  primary: { className: 'items-center justify-center rounded-[14px] bg-primary px-6', height: 52 },
  secondary: { className: 'items-center justify-center rounded-[14px] bg-surface-2 px-6', height: 52 },
  plain: { className: 'items-center justify-center rounded-[12px] px-4', height: 44 },
  destructive: { className: 'items-center justify-center rounded-[12px] px-4', height: 44 },
};

const LABEL: Record<Variant, keyof Palette> = {
  primary: 'onPrimary',
  secondary: 'ink',
  plain: 'accent',
  destructive: 'bad',
};

// Primary is navy in light and off-white in dark: the one strong surface on a
// screen. Secondary sits on the off-white step; plain and destructive are text.
export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  accessibilityHint,
}: ButtonProps) {
  const colors = useColors();
  const inactive = disabled || loading;
  const { className, height } = SURFACE[variant];
  const labelColor = colors[LABEL[variant]];
  return (
    <PressableScale
      onPress={onPress}
      disabled={inactive}
      className={disabled ? `${className} opacity-40` : className}
      style={style}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}>
      {/* The label keeps its space while loading so the button never changes
          size under the finger. */}
      <View style={{ minHeight: height, justifyContent: 'center' }}>
        <Text
          variant="headline"
          maxFontSizeMultiplier={1.3}
          style={{ color: labelColor, opacity: loading ? 0 : 1, textAlign: 'center' }}>
          {label}
        </Text>
        {loading && (
          <View className="absolute inset-0 items-center justify-center">
            <ActivityIndicator color={labelColor} />
          </View>
        )}
      </View>
    </PressableScale>
  );
}
