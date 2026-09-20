import Svg, { Path } from 'react-native-svg';

type BookmarkIconProps = {
  size?: number;
  color?: string;
  filled?: boolean;
};

export function BookmarkIcon({ size = 22, color = '#ffffff', filled = false }: BookmarkIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v16l-6-4-6 4V4Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={filled ? color : 'none'}
      />
    </Svg>
  );
}
