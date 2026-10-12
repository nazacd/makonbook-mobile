import { Platform, StyleSheet } from 'react-native';

// One type scale for the app, modelled on Apple's text styles. Hierarchy comes
// from size, weight and leading together; leading tightens as size grows.
//
// Tracking: on iOS the system font (SF Pro) already applies size-specific
// tracking and optical sizes on its own, so we leave letterSpacing alone
// there. Android's Roboto has no such table, so large sizes are tightened by
// hand and the smallest sizes opened up slightly.
const android = Platform.OS === 'android';
const track = (value: number) => (android ? value : 0);

export const type = StyleSheet.create({
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700', letterSpacing: track(-0.8) },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: track(-0.6) },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: track(-0.35) },
  title3: { fontSize: 20, lineHeight: 25, fontWeight: '600', letterSpacing: track(-0.25) },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: track(-0.15) },
  body: { fontSize: 17, lineHeight: 24, fontWeight: '400', letterSpacing: track(-0.1) },
  callout: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400', letterSpacing: track(0.1) },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500', letterSpacing: track(0.2) },
});

export type TypeVariant = keyof typeof type;
