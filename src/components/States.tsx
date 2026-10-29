import type { LucideIcon } from 'lucide-react-native';
import { useEffect } from 'react';
import { View, type DimensionValue } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Notice } from '@/components/Notice';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';

/**
 * A placeholder block in the shape of the content that is loading. Pulses
 * slowly; still under Reduce Motion.
 */
export function Skeleton({ width = '100%', height = 16, radius = 8 }: { width?: DimensionValue; height?: number; radius?: number }) {
  const colors = useColors();
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (!reduceMotion) pulse.value = withRepeat(withTiming(0.5, { duration: 800 }), -1, true);
  }, [pulse, reduceMotion]);
  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width, height, borderRadius: radius, backgroundColor: colors.surface2 }, style]}
    />
  );
}

/** Nothing to show yet: an icon, one line of title, one of explanation, and the action that fills it, if any. */
export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon: LucideIcon;
  title: string;
  message?: string;
  action?: { label: string; onPress: () => void };
}) {
  const colors = useColors();
  return (
    <View className="items-center gap-2 px-6 py-12" accessible accessibilityLabel={message ? `${title}. ${message}` : title}>
      <View
        style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
        <Icon as={icon} size={26} color={colors.ink2} />
      </View>
      <Text variant="title3" style={{ color: colors.ink, textAlign: 'center' }}>
        {title}
      </Text>
      {message && (
        <Text variant="subhead" style={{ color: colors.ink2, textAlign: 'center' }}>
          {message}
        </Text>
      )}
      {action && <Button label={action.label} variant="plain" onPress={action.onPress} />}
    </View>
  );
}

/** Content that failed to load: what went wrong, and a way to try again. */
export function ErrorState({
  title,
  message,
  onRetry,
  retrying = false,
  retryLabel = 'Try again',
}: {
  title: string;
  message: string;
  onRetry: () => void;
  retrying?: boolean;
  /** Parents read it in Uzbek or Russian. */
  retryLabel?: string;
}) {
  return (
    <View className="gap-3">
      <Notice tone="error" title={title} message={message} />
      <Button label={retryLabel} variant="secondary" onPress={onRetry} loading={retrying} />
    </View>
  );
}
