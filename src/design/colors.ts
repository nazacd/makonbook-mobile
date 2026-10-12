// The same tokens as the @theme block in src/global.css, for the places that
// take raw colour values instead of classNames: native headers and tab bars,
// ActivityIndicator, placeholder text. Keep the two in step.
export const colors = {
  brand: '#01000f',
  surface: '#16141d',
  accent: '#8b5cf6',
  text: '#ffffff',
  secondaryText: 'rgba(255, 255, 255, 0.6)',
  tertiaryText: 'rgba(255, 255, 255, 0.4)',
  separator: 'rgba(255, 255, 255, 0.08)',
  danger: '#f87171',
  warning: '#fbbf24',
  success: '#34d399',
} as const;
