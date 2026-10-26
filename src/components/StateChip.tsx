import { View } from 'react-native';

import { Text } from '@/components/Text';
import { useColors, type Palette } from '@/design/colors';
import type { MarkState } from '@/lib/api/types';

export const MARK_LABEL: Record<MarkState, string> = {
  pending: 'Not yet',
  present: 'Present',
  late: 'Late',
  absent: 'Absent',
};

/** Token for each mark; read it with useColors(): colors[MARK_COLOR[state]]. */
export const MARK_COLOR: Record<MarkState, keyof Palette> = {
  pending: 'ink3',
  present: 'good',
  late: 'watch',
  absent: 'bad',
};

// A small status label: a coloured dot and the word. Colour is never the only
// signal — the label always says it.
export function StateChip({ label, color }: { label: string; color: string }) {
  const colors = useColors();
  return (
    <View className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1" style={{ backgroundColor: colors.surface2 }}>
      <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      <Text variant="caption" style={{ color: colors.ink2 }}>
        {label}
      </Text>
    </View>
  );
}
