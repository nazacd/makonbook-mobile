import { useColorScheme } from 'react-native';

import { useAppearanceMode } from '@/lib/appearance';

// The same tokens as src/global.css, for the places that take raw colour values
// instead of classNames: native headers and the tab bar, ActivityIndicator,
// RefreshControl, placeholder text, SVG. Keep the two in step.
//
// Read them through useColors() inside a component, never at module level: the
// palette changes with the colour scheme (the phone's setting, or the Appearance
// choice in Profile), and only a hook re-renders when it does.

const light = {
  bg: '#f5efe3',
  surface: '#fffcf6',
  surface2: '#ede2cc',
  line: 'rgba(18, 45, 71, 0.12)',
  lineStrong: 'rgba(18, 45, 71, 0.24)',
  ink: '#122d47',
  ink2: '#4f606f',
  ink3: '#66737f',
  primary: '#122d47',
  onPrimary: '#f5efe3',
  accent: '#7a4590',
  onAccent: '#ffffff',
  accentTint: '#ece1ee',
  good: '#4a6b50',
  goodTint: '#dfe8dc',
  watch: '#86600e',
  watchTint: '#f3e3bd',
  bad: '#9e4527',
  badTint: '#f3d9cc',
  info: '#3d6f86',
  track: '#ede2cc',
  fillGood: '#2f7444',
  fillWatch: '#a87810',
  fillBad: '#9e4527',
  // Subject objects: two tones each, only size and opacity vary.
  math: '#122d47',
  math2: '#3d6f86',
  english: '#b65d3c',
  english2: '#9e4527',
};

export type Palette = typeof light;

const dark: Palette = {
  bg: '#0b1a2a',
  surface: '#122438',
  surface2: '#1a2f46',
  line: 'rgba(242, 234, 218, 0.1)',
  lineStrong: 'rgba(242, 234, 218, 0.2)',
  ink: '#f2eada',
  ink2: '#c2baa9',
  ink3: '#9a9487',
  primary: '#ede2cc',
  onPrimary: '#122d47',
  accent: '#c391d8',
  onAccent: '#0b1a2a',
  accentTint: '#2a2d48',
  good: '#9dbda2',
  goodTint: '#1d3434',
  watch: '#e0b24e',
  watchTint: '#2d2f2c',
  bad: '#e58d6b',
  badTint: '#302a31',
  info: '#97c1d5',
  track: '#24384e',
  fillGood: '#7fc28e',
  fillWatch: '#e0b24e',
  fillBad: '#e58d6b',
  math: '#97c1d5',
  math2: '#6f93ad',
  english: '#e58d6b',
  english2: '#c66f4e',
};

export const palettes = { light, dark } as const;

export type Scheme = keyof typeof palettes;

/** The colour scheme in effect: the Appearance choice, or the phone's setting. */
export function useScheme(): Scheme {
  // The choice comes through context, which reaches every component that reads
  // it, memoised or not. useColorScheme() alone only re-renders on changes the
  // phone reports, not on Appearance.setColorScheme() from JS.
  const mode = useAppearanceMode();
  const system = useColorScheme();
  if (mode !== 'system') return mode;
  return system === 'dark' ? 'dark' : 'light';
}

export function useColors(): Palette {
  return palettes[useScheme()];
}

/** The palette's own colours, for teacher initials and other fixed swatches. */
export const swatches = {
  navy: '#122d47',
  offWhite: '#ede2cc',
  terracotta: '#b65d3c',
  mustard: '#cb9725',
  sage: '#7d9b81',
  sky: '#97c1d5',
  violet: '#7a4590',
} as const;
