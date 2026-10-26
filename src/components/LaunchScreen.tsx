import { ActivityIndicator, Image, View } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';

import { useColors } from '@/design/colors';

// Must match the expo-splash-screen config in app.json (same image, same
// `imageWidth`, centered on the same background for the colour scheme) so the hand-off
// from the static native splash to this screen is invisible — the only change
// the user sees is the spinner appearing under the logo.
export const LAUNCH_LOGO = require('../../assets/makonbook-icon.png');
const LOGO_SIZE = 140;
const SPINNER_GAP = 32;

type LaunchScreenProps = {
  onLayout?: () => void;
};

export function LaunchScreen({ onLayout }: LaunchScreenProps) {
  const colors = useColors();
  return (
    <Animated.View
      exiting={FadeOut.duration(250)}
      onLayout={onLayout}
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.bg,
      }}>
      <Image source={LAUNCH_LOGO} style={{ width: LOGO_SIZE, height: LOGO_SIZE }} resizeMode="contain" />
      {/* Absolutely positioned so it doesn't push the logo off-center and out
          of line with the native splash. */}
      <View
        style={{ position: 'absolute', top: '50%', marginTop: LOGO_SIZE / 2 + SPINNER_GAP }}
        accessibilityLabel="Loading">
        <ActivityIndicator size="large" color={colors.ink3} />
      </View>
    </Animated.View>
  );
}
