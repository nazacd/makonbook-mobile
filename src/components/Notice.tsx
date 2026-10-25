import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Text } from '@/components/Text';
import { useColors, type Palette } from '@/design/colors';

type Tone = 'info' | 'warning' | 'error' | 'success';

const TONE: Record<Tone, keyof Palette> = {
  info: 'info',
  warning: 'watch',
  error: 'bad',
  success: 'good',
};

type NoticeProps = {
  tone: Tone;
  title?: string;
  message: string;
};

// An inline status message, placed next to what it is about. Colour sits on a
// solid mark, never on the text itself, so the message stays legible.
export function Notice({ tone, title, message }: NoticeProps) {
  const colors = useColors();
  return (
    <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)}>
      <View
        className="flex-row gap-3 rounded-2xl bg-surface p-4"
        accessibilityRole={tone === 'error' ? 'alert' : undefined}
        accessibilityLiveRegion="polite">
        <View className="mt-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: colors[TONE[tone]] }} />
        <View className="flex-1 gap-0.5">
          {title && <Text variant="headline" className="text-ink">{title}</Text>}
          <Text variant="subhead" style={{ color: colors.ink2 }}>
            {message}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
