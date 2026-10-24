import { Pressable, View } from 'react-native';

import { Text } from '@/components/Text';
import { colors } from '@/design/colors';
import type { Group, GroupAttendance, Weekday } from '@/lib/api/types';
import { formatWeekdays } from '@/lib/schedule';

/** The card's words; parents read it in Uzbek or Russian. */
export type GroupCardLabels = {
  weekdays: (days: Weekday[]) => string;
  room: (room: string) => string;
  attendance: string;
  noLessons: string;
  attended: (attended: number, lessons: number) => string;
  late: (n: number) => string;
  absent: (n: number) => string;
};

const ENGLISH: GroupCardLabels = {
  weekdays: formatWeekdays,
  room: (room) => `Room ${room}`,
  attendance: 'Attendance',
  noLessons: 'No lessons recorded yet',
  attended: (a, n) => `${a} of ${n} lessons`,
  late: (n) => `${n} late`,
  absent: (n) => `${n} absent`,
};

type GroupCardProps = {
  group: Group;
  showTeachers: boolean;
  /** The student's attendance in this group; adds a row that opens it. */
  attendance?: GroupAttendance;
  onAttendance?: () => void;
  labels?: GroupCardLabels;
};

export function GroupCard({ group, showTeachers, attendance, onAttendance, labels = ENGLISH }: GroupCardProps) {
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
              {labels.weekdays(slot.weekdays)}
            </Text>
            <Text variant="subhead" className="text-white" style={{ fontVariant: ['tabular-nums'] }}>
              {slot.begin_time}–{slot.end_time}
            </Text>
          </View>
          <Text variant="footnote" style={{ color: colors.secondaryText }}>
            {[slot.classroom && labels.room(slot.classroom), showTeachers && slot.teachers.join(', ')]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
      ))}
      {onAttendance && <AttendanceRow attendance={attendance} onPress={onAttendance} labels={labels} />}
    </View>
  );
}

// Attendance sits on the card it belongs to, one tap from the full list.
function AttendanceRow({
  attendance,
  onPress,
  labels,
}: {
  attendance?: GroupAttendance;
  onPress: () => void;
  labels: GroupCardLabels;
}) {
  const s = attendance?.summary;
  const attended = s ? s.present + s.late : 0;
  const detail = !s
    ? labels.noLessons
    : [labels.attended(attended, s.lessons), s.late > 0 && labels.late(s.late), s.absent > 0 && labels.absent(s.absent)]
        .filter(Boolean)
        .join(' · ');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${labels.attendance}: ${detail}`}
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
            {labels.attendance}
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
