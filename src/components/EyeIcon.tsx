import Svg, { Path } from 'react-native-svg';

type EyeIconProps = {
  /** Draws the eye struck through. */
  slashed?: boolean;
  size?: number;
  color?: string;
};

export function EyeIcon({ slashed = false, size = 22, color = '#ffffff' }: EyeIconProps) {
  const stroke = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" {...stroke} />
      <Path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" {...stroke} />
      {slashed && <Path d="M4 4l16 16" {...stroke} />}
    </Svg>
  );
}
