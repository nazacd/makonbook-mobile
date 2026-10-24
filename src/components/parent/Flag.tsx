import { View } from 'react-native';
import Svg, { Circle, Polygon, Rect } from 'react-native-svg';

import type { Lang } from '@/lib/parent/i18n';

// A five-pointed star's corners, for an SVG polygon.
function star(cx: number, cy: number, r: number): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * 0.4;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    points.push(`${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`);
  }
  return points.join(' ');
}

// Uzbekistan's 12 stars: rows of 3, 4 and 5, right-aligned beside the crescent.
const UZ_STARS = [
  [3, 14],
  [4, 32],
  [5, 50],
].flatMap(([n, y]) => Array.from({ length: n }, (_, i) => star(148 - (n - 1 - i) * 15, y, 5)));

// Drawn rather than emoji: emoji flags don't show everywhere (Windows shows
// letters), and these match each other in size and shape. Both are drawn 3:2.
export function Flag({ lang, width = 30 }: { lang: Lang; width?: number }) {
  const height = (width * 2) / 3;
  return (
    <View style={{ width, height, borderRadius: 4, overflow: 'hidden' }}>
      <Svg width={width} height={height} viewBox="0 0 300 200">
        {lang === 'uz' ? (
          <>
            <Rect x={0} y={0} width={300} height={64} fill="#0099B5" />
            <Rect x={0} y={64} width={300} height={72} fill="#CE1126" />
            <Rect x={0} y={68} width={300} height={64} fill="#FFFFFF" />
            <Rect x={0} y={136} width={300} height={64} fill="#1EB53A" />
            <Circle cx={52} cy={32} r={24} fill="#FFFFFF" />
            <Circle cx={60} cy={32} r={21} fill="#0099B5" />
            {UZ_STARS.map((points, i) => (
              <Polygon key={i} points={points} fill="#FFFFFF" />
            ))}
          </>
        ) : (
          <>
            <Rect x={0} y={0} width={300} height={67} fill="#FFFFFF" />
            <Rect x={0} y={67} width={300} height={66} fill="#0039A6" />
            <Rect x={0} y={133} width={300} height={67} fill="#D52B1E" />
          </>
        )}
      </Svg>
    </View>
  );
}
