import { View } from 'react-native';

import { Text } from '@/components/Text';
import { colors } from '@/design/colors';
import type { MarkState } from '@/lib/api/types';

export const MARK_LABEL: Record<MarkState, string> = {
  pending: 'Not yet',
  present: 'Present',
  late: 'Late',
  absent: 'Absent',
};

export const MARK_COLOR: Record<MarkState, string> = {
  pending: colors.tertiaryText,
  present: colors.success,
  late: colors.warning,
  absent: colors.danger,
};

// A small status label: a coloured dot and the word. Colour is never the only
// signal — the label always says it.
export function StateChip({ label, color }: { label: string; color: string }) {
  return (
    <View className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
      <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      <Text variant="caption" style={{ color: colors.secondaryText }}>
        {label}
      </Text>
    </View>
  );
}
