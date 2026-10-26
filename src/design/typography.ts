import { Platform, StyleSheet } from 'react-native';

// Bitter, a sturdy slab, for titles and big numbers; the system font for
// everything people read. Loaded in the root layout (useFonts) before the
// launch screen goes away. Each weight is its own family name, so Android never
// synthesises a bold on top of it: set the family, not fontWeight.
export const fonts = {
  displaySemiBold: 'Bitter_600SemiBold',
  displayBold: 'Bitter_700Bold',
} as const;

// One type scale for the app, modelled on Apple's text styles. Hierarchy comes
// from size, weight and leading together; leading tightens as size grows.
//
// Tracking: on iOS the system font (SF Pro) already applies size-specific
// tracking and optical sizes on its own, so we leave letterSpacing alone
// there. Android's Roboto has no such table, so its smallest sizes are opened
// up slightly. Bitter has its own spacing on both.
const android = Platform.OS === 'android';
const track = (value: number) => (android ? value : 0);

export const type = StyleSheet.create({
  largeTitle: { fontSize: 34, lineHeight: 41, fontFamily: fonts.displayBold, letterSpacing: -0.4 },
  title: { fontSize: 28, lineHeight: 34, fontFamily: fonts.displayBold, letterSpacing: -0.3 },
  title2: { fontSize: 22, lineHeight: 28, fontFamily: fonts.displayBold, letterSpacing: -0.1 },
  title3: { fontSize: 20, lineHeight: 26, fontFamily: fonts.displaySemiBold },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: track(-0.15) },
  body: { fontSize: 17, lineHeight: 24, fontWeight: '400', letterSpacing: track(-0.1) },
  callout: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400', letterSpacing: track(0.1) },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500', letterSpacing: track(0.2) },
});

export type TypeVariant = keyof typeof type;
