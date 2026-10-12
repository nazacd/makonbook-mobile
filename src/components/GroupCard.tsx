import { View } from 'react-native';

import { Text } from '@/components/Text';
import { colors } from '@/design/colors';
import type { Group } from '@/lib/api/types';
import { formatWeekdays } from '@/lib/schedule';

export function GroupCard({ group, showTeachers }: { group: Group; showTeachers: boolean }) {
  return (
    <View className="gap-4 rounded-3xl bg-surface p-5">
      <View className="gap-1">
        <Text variant="caption" style={{ color: colors.accent, textTransform: 'uppercase' }}>
          {group.discipline}
        </Text>
        <Text variant="headline" className="text-white">
          {group.name}
        </Text>
        <Text variant="footnote" style={{ color: colors.tertiaryText }}>
          {group.office}
        </Text>
      </View>

      {group.schedule.map((slot, i) => (
        <View
          key={i}
          className="gap-1 pt-4"
          style={{ borderTopWidth: 1, borderTopColor: colors.separator }}>
          <View className="flex-row items-baseline justify-between gap-3">
            <Text variant="subhead" className="flex-1 text-white" style={{ fontWeight: '600' }}>
              {formatWeekdays(slot.weekdays)}
            </Text>
            <Text variant="subhead" className="text-white" style={{ fontVariant: ['tabular-nums'] }}>
              {slot.begin_time}–{slot.end_time}
            </Text>
          </View>
          <Text variant="footnote" style={{ color: colors.secondaryText }}>
            {[slot.classroom && `Room ${slot.classroom}`, showTeachers && slot.teachers.join(', ')]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
      ))}
    </View>
  );
}
