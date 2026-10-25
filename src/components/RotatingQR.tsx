import { useEffect } from 'react';
import { useWindowDimensions, View } from 'react-native';
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
};

const WINDOW_MS = WINDOW_SECONDS * 1000;

// The attendance QR. A new code every 10 seconds, computed on this phone, so
// it keeps changing even offline. Dark on white whatever the app theme: that
// is what phone cameras read most reliably.
//
// The bar under it empties as the code's time runs out — continuous, linear
// motion that says "this changes on its own", rather than a jump every 10 s.
export function RotatingQR({ sessionId, secret, clockOffsetMs }: RotatingQRProps) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const size = Math.min(width - 72, 340);
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

  return (
    <View className="items-center gap-3">
      <View
        className="items-center justify-center rounded-3xl p-4"
        style={{ backgroundColor: '#ffffff' }}
        accessible
        accessibilityRole="image"
        accessibilityLabel="Attendance QR code. Students scan it with MakonBook.">
        {/* Always navy on white, in both themes, so every camera reads it. */}
        <QRCode value={value} size={size} color="#122d47" backgroundColor="#ffffff" ecl="M" />
      </View>
      {reduceMotion ? (
        <Text variant="footnote" style={{ color: colors.ink3 }}>
          The code changes every {WINDOW_SECONDS} seconds.
        </Text>
      ) : (
        <View className="h-1 overflow-hidden rounded-full" style={{ width: size, backgroundColor: colors.line }}>
          <Animated.View
            style={[{ height: '100%', width: '100%', backgroundColor: colors.accent, transformOrigin: 'left' }, barStyle]}
          />
        </View>
      )}
    </View>
  );
}
