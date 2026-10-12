import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Text } from '@/components/Text';
import { colors } from '@/design/colors';

type Tone = 'info' | 'warning' | 'error' | 'success';

const TONE: Record<Tone, string> = {
  info: colors.accent,
  warning: colors.warning,
  error: colors.danger,
  success: colors.success,
};

type NoticeProps = {
  tone: Tone;
  title?: string;
  message: string;
};

// An inline status message, placed next to what it is about. Colour sits on a
// solid mark, never on the text itself, so the message stays legible.
export function Notice({ tone, title, message }: NoticeProps) {
  return (
    <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)}>
      <View
        className="flex-row gap-3 rounded-2xl bg-surface p-4"
        accessibilityRole={tone === 'error' ? 'alert' : undefined}
        accessibilityLiveRegion="polite">
        <View className="mt-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: TONE[tone] }} />
        <View className="flex-1 gap-0.5">
          {title && <Text variant="headline" className="text-white">{title}</Text>}
          <Text variant="subhead" style={{ color: colors.secondaryText }}>
            {message}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
