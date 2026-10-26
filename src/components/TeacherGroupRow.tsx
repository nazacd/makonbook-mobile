import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import type { Group } from '@/lib/api/types';
import { dayLetters, parseClassName, teacherTitle } from '@/lib/groups';

/** How a teacher's tab names a group: "Pre-SAT Math", "IV · Diyora Adilova". */
export const groupTitle = (group: Group) => teacherTitle(parseClassName(group.name, group.discipline));

// One of a teacher's groups on a tab: its name, a subject dot and when it
// meets, and on the right whatever the tab counts (nothing while that's none).
export function TeacherGroupRow({
  group,
  first,
  onPress,
  details,
  right,
}: {
  group: Group;
  first: boolean;
  onPress: () => void;
  /** What `right` says, for screen readers. */
  details?: string | false | null;
  right?: ReactNode;
}) {
  const colors = useColors();
  const name = parseClassName(group.name, group.discipline);
  const title = teacherTitle(name);
  const slot = group.schedule[0];
  const time = slot ? `${slot.begin_time} · ${dayLetters(slot.weekdays)}` : null;
  const dot = name.subject === 'Math' ? colors.math : name.subject === 'English' ? colors.english : colors.ink3;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[title, time, details].filter(Boolean).join(', ')}
      style={({ pressed }) => ({ marginHorizontal: -20, paddingHorizontal: 20, backgroundColor: pressed ? colors.surface2 : 'transparent' })}>
      <View className="flex-row items-center gap-3" style={{ minHeight: 72, paddingVertical: 12, borderTopWidth: first ? 0 : 1, borderTopColor: colors.line }}>
        <View className="flex-1 gap-1">
          <Text variant="title3" style={{ color: colors.ink }}>
            {title}
          </Text>
          {time && (
            <View className="flex-row items-center gap-2">
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dot }} />
              <Text variant="subhead" style={{ color: colors.ink2, fontVariant: ['tabular-nums'] }}>
                {time}
              </Text>
            </View>
          )}
        </View>
        {right}
      </View>
    </Pressable>
  );
}
