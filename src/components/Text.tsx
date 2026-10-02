import { Platform, Text as RNText, type TextProps } from 'react-native';

// Drop-in replacement for React Native's <Text>. Use it everywhere instead of
// importing Text from 'react-native'.
//
// On Android, React Native can draw text wider than the box it measured for it
// after a system configuration change while the app is open (seen when
// toggling light/dark mode on an Honor X8b). The text then wraps inside its
// box and the overflow is clipped: "SAT MAKON" -> "SAT", "Level Check" ->
// "Level", "English" -> "Englis". Two separate measure/draw mismatches cause
// this, and each default below removes one:
//
// - allowFontScaling={false}: font sizes are converted to pixels with the
//   system font scale (TypedValue SP), which is re-read on a configuration
//   change, while measurements made before the change are reused from cache.
//   Without font scaling, sizes depend only on screen density, which doesn't
//   change. Upstream: https://github.com/facebook/react-native/issues/52895
// - fontFamily 'sans-serif': text with no family is measured with
//   Typeface.DEFAULT but drawn with the TextView's theme-inherited typeface
//   (ReactTypefaceUtils.applyStyles). Upstream:
//   https://github.com/react/react-native/pull/58036
//
// Trade-off: the app's text ignores the phone's font size setting. The test
// screens are laid out for fixed sizes, so this is acceptable here.
const BASE_STYLE = Platform.OS === 'android' ? { fontFamily: 'sans-serif' } : null;

export function Text({ style, ...props }: TextProps) {
  return <RNText allowFontScaling={false} {...props} style={[BASE_STYLE, style]} />;
}
