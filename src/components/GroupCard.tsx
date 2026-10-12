import { Pressable, View } from 'react-native';

import { Text } from '@/components/Text';
import { colors } from '@/design/colors';
import type { Group, GroupAttendance } from '@/lib/api/types';
import { formatWeekdays } from '@/lib/schedule';

type GroupCardProps = {
  group: Group;
  showTeachers: boolean;
  /** The student's attendance in this group; adds a row that opens it. */
  attendance?: GroupAttendance;
  onAttendance?: () => void;
};

export function GroupCard({ group, showTeachers, attendance, onAttendance }: GroupCardProps) {
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
      {onAttendance && <AttendanceRow attendance={attendance} onPress={onAttendance} />}
    </View>
  );
}

// Attendance sits on the card it belongs to, one tap from the full list.
function AttendanceRow({ attendance, onPress }: { attendance?: GroupAttendance; onPress: () => void }) {
  const s = attendance?.summary;
  const attended = s ? s.present + s.late : 0;
  const detail = !s
    ? 'No lessons recorded yet'
    : `${attended} of ${s.lessons} lessons${s.late ? ` · ${s.late} late` : ''}${s.absent ? ` · ${s.absent} absent` : ''}`;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Attendance: ${detail}`}
      style={({ pressed }) => ({
        marginHorizontal: -20,
        marginBottom: -20,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: colors.separator,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        backgroundColor: pressed ? 'rgba(255,255,255,0.06)' : 'transparent',
      })}>
      <View className="flex-row items-center gap-3">
        <View className="flex-1 gap-0.5">
          <Text variant="subhead" className="text-white" style={{ fontWeight: '600' }}>
            Attendance
          </Text>
          <Text variant="footnote" style={{ color: colors.secondaryText }}>
            {detail}
          </Text>
        </View>
        {s && s.lessons > 0 && (
          <Text variant="title3" style={{ color: colors.text, fontVariant: ['tabular-nums'] }}>
            {Math.round((attended / s.lessons) * 100)}%
          </Text>
        )}
        <Text variant="body" style={{ color: colors.tertiaryText }}>
          ›
        </Text>
      </View>
    </Pressable>
  );
}
