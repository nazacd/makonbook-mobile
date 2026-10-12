import Svg, { Circle, Path, Rect } from 'react-native-svg';

type IconProps = { size?: number; color: string; filled?: boolean };

const stroke = (color: string) => ({ stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }) as const;

export function CalendarIcon({ size = 26, color, filled }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3.5" y="5" width="17" height="15.5" rx="3" {...stroke(color)} fill={filled ? color : 'none'} fillOpacity={filled ? 0.18 : 0} />
      <Path d="M3.5 9.5h17M8 3v4M16 3v4" {...stroke(color)} />
      <Path d="M8 13.5h2M14 13.5h2M8 17h2" {...stroke(color)} />
    </Svg>
  );
}

export function PersonIcon({ size = 26, color, filled }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8.5" r="3.75" {...stroke(color)} fill={filled ? color : 'none'} fillOpacity={filled ? 0.18 : 0} />
      <Path d="M4.75 20c.9-3.6 3.75-5.5 7.25-5.5s6.35 1.9 7.25 5.5" {...stroke(color)} />
    </Svg>
  );
}

// A QR code inside scanner corners.
export function ScanIcon({ size = 28, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 8V5.5A2.5 2.5 0 0 1 5.5 3H8M16 3h2.5A2.5 2.5 0 0 1 21 5.5V8M21 16v2.5a2.5 2.5 0 0 1-2.5 2.5H16M8 21H5.5A2.5 2.5 0 0 1 3 18.5V16" {...stroke(color)} strokeWidth={2} />
      <Rect x="7" y="7" width="4" height="4" rx="0.8" fill={color} />
      <Rect x="13" y="7" width="4" height="4" rx="0.8" fill={color} />
      <Rect x="7" y="13" width="4" height="4" rx="0.8" fill={color} />
      <Path d="M13.5 13.5h1.5v1.5M17 13.5v.01M13.5 17h3.5" {...stroke(color)} strokeWidth={1.6} />
    </Svg>
  );
}
