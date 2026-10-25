import { createContext, use } from 'react';
import { Platform, Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { type, type TypeVariant } from '@/design/typography';

// Drop-in replacement for React Native's <Text>. Use it everywhere instead of
// importing Text from 'react-native'.
//
// Text follows the phone's font size setting, capped so layouts hold together:
// MAX_SCALE for everything, a tighter cap for the large display sizes, which
// are already big. The timed test screens are laid out for fixed sizes and opt
// out with <FixedTextScale>.
//
// On Android, React Native can draw text wider than the box it measured for it
// after a system configuration change while the app is open (seen when
// toggling light/dark mode or the font size on an Honor X8b). The text then
// wraps inside its box and the overflow is clipped: "SAT MAKON" -> "SAT". One
// cause is text with no family being measured with Typeface.DEFAULT but drawn
// with the TextView's theme-inherited typeface
// (https://github.com/react/react-native/pull/58036), which fontFamily
// 'sans-serif' removes. The other is the font scale being re-read on a
// configuration change while cached measurements are reused
// (https://github.com/facebook/react-native/issues/52895): with scaling on,
// that can still happen right after the font size setting changes, until the
// screen re-renders.
const BASE_STYLE = Platform.OS === 'android' ? { fontFamily: 'sans-serif' } : null;

const MAX_SCALE = 1.4;
const MAX_SCALE_DISPLAY = 1.2;
const DISPLAY: TypeVariant[] = ['largeTitle', 'title', 'title2'];

const FixedScale = createContext(false);

/** Text inside ignores the phone's font size (timed test screens). */
export function FixedTextScale({ children }: { children: React.ReactNode }) {
  return <FixedScale value>{children}</FixedScale>;
}

type TextProps = RNTextProps & {
  /** A style from the app's type scale (src/design/typography.ts). */
  variant?: TypeVariant;
};

export function Text({ variant, style, ...props }: TextProps) {
  const fixed = use(FixedScale);
  return (
    <RNText
      allowFontScaling={!fixed}
      maxFontSizeMultiplier={variant && DISPLAY.includes(variant) ? MAX_SCALE_DISPLAY : MAX_SCALE}
      {...props}
      style={[BASE_STYLE, variant && type[variant], style]}
    />
  );
}
