import { Clock, DoorOpen, User } from 'lucide-react-native';
import { View } from 'react-native';

import { AttendanceBar } from '@/components/AttendanceBar';
import { Icon } from '@/components/Icon';
import { SubjectSpill, useSpillLayout } from '@/components/SubjectSpill';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import type { Group, GroupAttendance } from '@/lib/api/types';
import { dayLetters, daysSpoken, normalCase, parseClassName } from '@/lib/groups';

/** The block's words; parents read them in Uzbek or Russian. */
export type ClassBlockLabels = {
  attendance: string;
  attendanceA11y: (pct: number) => string;
  room: (room: string) => string;
  /** Spoken days for screen readers ("Tuesday, Thursday, Saturday"). */
  days: (days: Group['schedule'][number]['weekdays']) => string;
};

const ENGLISH: ClassBlockLabels = {
  attendance: 'Attendance',
  attendanceA11y: (pct) => `Attendance ${pct}%, opens class details`,
  room: (room) => `Room ${room}`,
  days: daysSpoken,
};

type ClassBlockProps = {
  group: Group;
  /** The student's attendance in this group; the bar shows once there has been a lesson. */
  attendance?: GroupAttendance;
  onAttendance?: () => void;
  labels?: ClassBlockLabels;
};

// A class, set on the page as type: its name, then teacher, time with days,
// and room, each on its own line. No card. The subject's objects spill in from
// the screen's edge behind it; the attendance bar sits at its bottom right.
export function ClassBlock({ group, attendance, onAttendance, labels = ENGLISH }: ClassBlockProps) {
  const colors = useColors();
  const spill = useSpillLayout();
  const name = parseClassName(group.name, group.discipline);
  const teacher = name.teacher ?? (group.schedule[0]?.teachers[0] ? normalCase(group.schedule[0].teachers[0]) : null);
  // One time line per distinct slot; rooms listed once.
  const times = [...new Map(group.schedule.map((s) => [`${s.begin_time}|${s.weekdays.join()}`, s])).values()];
  const rooms = [...new Set(group.schedule.map((s) => s.classroom).filter(Boolean))];
  const s = attendance?.summary;
  const rate = s && s.lessons > 0 ? (s.present + s.late) / s.lessons : null;

  return (
    <View className="flex-row items-end gap-3">
      {name.subject && <SubjectSpill layout={spill} subject={name.subject} level={name.isPrivate ? 'foundation' : (name.level ?? 'foundation')} seed={group.id} />}
      <View className="flex-1 gap-2">
        <View {...spill.keepOut('title')} className="flex-row items-center gap-2 self-start">
          <Text variant="title2" style={{ color: colors.ink }} accessibilityRole="header">
            {name.title}
          </Text>
          {name.isPrivate && (
            <View style={{ borderWidth: 1.5, borderColor: colors.ink2, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 }}>
              <Text variant="caption" style={{ color: colors.ink2 }}>
                1:1
              </Text>
            </View>
          )}
        </View>
        <View className="gap-1">
          {teacher && (
            <Line keepOut={spill.keepOut('teacher')} icon={User}>
              <Text variant="subhead" style={{ color: colors.ink2 }}>
                {teacher}
              </Text>
            </Line>
          )}
          {times.map((slot, i) => (
            <Line key={i} keepOut={spill.keepOut(`time${i}`)} icon={Clock} accessibilityLabel={`${slot.begin_time}, ${labels.days(slot.weekdays)}`}>
              <Text variant="subhead" style={{ color: colors.ink2, fontVariant: ['tabular-nums'] }}>
                {slot.begin_time}
              </Text>
              <Text variant="caption" style={{ color: colors.ink2, letterSpacing: 0.6 }}>
                {dayLetters(slot.weekdays)}
              </Text>
            </Line>
          ))}
          {rooms.length > 0 && (
            <Line keepOut={spill.keepOut('room')} icon={DoorOpen} accessibilityLabel={labels.room(rooms.join(', '))}>
              <Text variant="subhead" style={{ color: colors.ink2 }}>
                {rooms.join(', ')}
              </Text>
            </Line>
          )}
        </View>
      </View>
      {rate !== null && onAttendance && (
        <View {...spill.keepOut('attendance', { toEdge: true })}>
          <AttendanceBar rate={rate} onPress={onAttendance} label={labels.attendance} accessibilityLabel={labels.attendanceA11y} />
        </View>
      )}
    </View>
  );
}

function Line({
  icon,
  keepOut,
  accessibilityLabel,
  children,
}: {
  icon: typeof User;
  keepOut: ReturnType<ReturnType<typeof useSpillLayout>['keepOut']>;
  accessibilityLabel?: string;
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View {...keepOut} className="flex-row items-center gap-2 self-start" accessible={!!accessibilityLabel} accessibilityLabel={accessibilityLabel}>
      <Icon as={icon} size={16} color={colors.ink3} />
      {children}
    </View>
  );
}
