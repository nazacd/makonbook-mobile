import { createContext, use, useEffect, useState } from 'react';
import { Appearance, Dimensions, PixelRatio, Platform, Text as RNText, type TextProps as RNTextProps } from 'react-native';

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
// (https://github.com/facebook/react-native/issues/52895), which remounting
// every Text after such a change removes (TextConfigEpoch below).
const BASE_STYLE = Platform.OS === 'android' ? { fontFamily: 'sans-serif' } : null;

const MAX_SCALE = 1.4;
const MAX_SCALE_DISPLAY = 1.2;
const DISPLAY: TypeVariant[] = ['largeTitle', 'title', 'title2'];

const FixedScale = createContext(false);

// Bumped whenever the phone's colour scheme or font size changes while the app
// is open. React Native caches text measurements by the attributes that affect
// layout (colour isn't one), so after such a change a label can keep a width
// measured under the old configuration, even when remounted: the clipping
// described above, seen on an Honor phone when the system theme switched.
// Each bump nudges maxFontSizeMultiplier by an invisible amount, which makes
// every label a cache miss and measures it again.
const ConfigEpoch = createContext(0);

/** Remounts all text after the phone's theme or font size changes. Once, near the root. */
export function TextConfigEpoch({ children }: { children: React.ReactNode }) {
  const [epoch, setEpoch] = useState(0);
  useEffect(() => {
    // A moment after the event: measuring at once can still use the
    // configuration Android is replacing.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const bump = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setEpoch((e) => e + 1), 500);
    };
    const appearance = Appearance.addChangeListener(bump);
    let fontScale = PixelRatio.getFontScale();
    const dimensions = Dimensions.addEventListener('change', ({ window }) => {
      if (window.fontScale !== fontScale) {
        fontScale = window.fontScale;
        bump();
      }
    });
    return () => {
      clearTimeout(timer);
      appearance.remove();
      dimensions.remove();
    };
  }, []);
  return <ConfigEpoch value={epoch}>{children}</ConfigEpoch>;
}

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
  const epoch = use(ConfigEpoch);
  const nudge = (epoch % 2) * 0.0001;
  return (
    <RNText
      allowFontScaling={!fixed}
      {...props}
      maxFontSizeMultiplier={(props.maxFontSizeMultiplier ?? (variant && DISPLAY.includes(variant) ? MAX_SCALE_DISPLAY : MAX_SCALE)) + nudge}
      style={[BASE_STYLE, variant && type[variant], style]}
    />
  );
}
