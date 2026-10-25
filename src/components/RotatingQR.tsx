import { useEffect } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import { attendanceLink, fromBase64Url, sign, WINDOW_SECONDS, windowAt } from '@/lib/attendance/code';
import { useFastNow } from '@/lib/clock';

type RotatingQRProps = {
  sessionId: string;
  secret: string; // base64url, from the session
  clockOffsetMs: number; // server time − this phone's time
  /** Side of the code in dp; defaults to fit the screen width. */
  size?: number;
  /** Makes the code tappable (opens it full screen). */
  onPress?: () => void;
  /** Drawn straight on a white page (full screen): no tile around it. */
  bare?: boolean;
};

const WINDOW_MS = WINDOW_SECONDS * 1000;
const NAVY = '#122d47';
const VIOLET = '#7a4590';

// The attendance QR. A new code every 10 seconds, computed on this phone, so
// it keeps changing even offline. Navy on white whatever the app theme: that
// is what phone cameras read most reliably.
//
// The bar under it empties as the code's time runs out — continuous, linear
// motion that says "this changes on its own", rather than a jump every 10 s.
export function RotatingQR({ sessionId, secret, clockOffsetMs, size: sizeProp, onPress, bare = false }: RotatingQRProps) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const size = sizeProp ?? Math.min(width - 112, 300);
  const now = useFastNow() + clockOffsetMs;
  const window = windowAt(now);
  const value = attendanceLink(sessionId, window, sign(fromBase64Url(secret), sessionId, window));

  const reduceMotion = useReducedMotion();
  const remaining = useSharedValue(1);
  useEffect(() => {
    const left = WINDOW_MS - ((Date.now() + clockOffsetMs) % WINDOW_MS);
    remaining.value = left / WINDOW_MS;
    remaining.value = withTiming(0, { duration: left, easing: Easing.linear });
  }, [window, clockOffsetMs, remaining]);
  const barStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: remaining.value }] }));

  const code = <QRCode value={value} size={size} color={NAVY} backgroundColor="#ffffff" ecl="M" />;

  return (
    <View className="items-center gap-3">
      {bare ? (
        <View accessible accessibilityRole="image" accessibilityLabel="Attendance QR code. Students scan it with MakonBook.">
          {code}
        </View>
      ) : (
        <Pressable
          onPress={onPress}
          disabled={!onPress}
          accessibilityRole={onPress ? 'button' : 'image'}
          accessibilityLabel="Attendance QR code. Students scan it with MakonBook."
          accessibilityHint={onPress ? 'Shows the code full screen' : undefined}
          style={({ pressed }) => ({
            padding: 14,
            borderRadius: 20,
            backgroundColor: '#ffffff',
            borderWidth: 1,
            borderColor: colors.line,
            opacity: pressed ? 0.85 : 1,
          })}>
          {code}
        </Pressable>
      )}
      {reduceMotion ? (
        <Text variant="footnote" style={{ color: bare ? '#66737f' : colors.ink3 }}>
          The code changes every {WINDOW_SECONDS} seconds.
        </Text>
      ) : (
        <View className="overflow-hidden rounded-full" style={{ width: size, height: 4, backgroundColor: bare ? '#ede2cc' : colors.track }}>
          <Animated.View
            style={[{ height: '100%', width: '100%', backgroundColor: bare ? VIOLET : colors.accent, transformOrigin: 'left' }, barStyle]}
          />
        </View>
      )}
    </View>
  );
}
