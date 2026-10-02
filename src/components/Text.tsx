import { Platform, Text as RNText, type TextProps } from 'react-native';

// Drop-in replacement for React Native's <Text>. Use it everywhere instead of
// importing Text from 'react-native'.
//
// On Android, a <Text> with no fontFamily is measured with Typeface.DEFAULT
// but drawn with the TextView's theme-inherited typeface
// (ReactTypefaceUtils.applyStyles). After a system configuration change, e.g.
// toggling light/dark mode while the app is open, the two can diverge,
// especially for bold text and on OEM ROMs that swap the system font. The text
// is then drawn wider than it was measured, wraps, and the last word or letters
// are clipped ("SAT MAKON" -> "SAT", "Math" -> "Mat"). Naming the family
// explicitly makes measurement and drawing resolve the exact same typeface.
// Upstream fix in progress: https://github.com/react/react-native/pull/58036
const BASE_STYLE = Platform.OS === 'android' ? { fontFamily: 'sans-serif' } : null;

export function Text({ style, ...props }: TextProps) {
  return <RNText {...props} style={[BASE_STYLE, style]} />;
}
