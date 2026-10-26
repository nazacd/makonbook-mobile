import { View, type DimensionValue } from 'react-native';

import { useColors } from '@/design/colors';
import type { ListProgress } from '@/lib/vocab/progress';

/** A list's progress as one bar: learned (dark) over started (grey) on the track. */
export function UnitBar({ progress, width = '100%', height = 6 }: { progress: ListProgress; width?: DimensionValue; height?: number }) {
  const colors = useColors();
  const pct = (n: number) => `${progress.total ? (100 * n) / progress.total : 0}%` as const;
  return (
    <View
      accessible
      accessibilityLabel={`${progress.learned} of ${progress.total} learned, ${progress.started} started. A word counts as learned once its next review is three weeks or more away.`}
      style={{ width, height, borderRadius: height / 2, backgroundColor: colors.track, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: pct(progress.started), backgroundColor: colors.lineStrong }} />
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: pct(progress.learned), backgroundColor: colors.primary, borderRadius: height / 2 }} />
    </View>
  );
}
