import { router } from 'expo-router';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GroupCard } from '@/components/GroupCard';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import { useMyAttendance } from '@/lib/api/attendance';
import { useMe } from '@/lib/api/queries';
import type { Profile } from '@/lib/api/types';
import { useNow } from '@/lib/clock';
import { describeDay, nextClass } from '@/lib/schedule';

// The student's home: next class and their groups. (Teachers get TeacherToday.)
export function StudentClasses() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const me = useMe();
  const profile = me.data as Profile; // the signed-in layout only renders with a profile
  const now = useNow();
  const attendance = useMyAttendance();
  const next = nextClass(profile.groups, now);

  return (
    <ScrollView
      className="flex-1 bg-brand"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 32 }}
      contentContainerClassName="gap-4 px-5"
      refreshControl={
        <RefreshControl
          refreshing={me.isRefetching || attendance.isRefetching}
          onRefresh={() => {
            me.refetch();
            attendance.refetch();
          }}
          tintColor={colors.accent}
          colors={[colors.accent]}
          progressBackgroundColor={colors.surface}
        />
      }>
      <View className="gap-1 pb-2">
        <Text variant="subhead" style={{ color: colors.ink2 }}>
          Hi, {profile.first_name}
        </Text>
        <Text variant="largeTitle" className="text-ink" accessibilityRole="header">
          Classes
        </Text>
      </View>

      {next && (
        <View
          className="gap-1 rounded-3xl px-5 py-5"
          style={{ backgroundColor: colors.accentTint }}
          accessibilityRole="summary">
          <Text variant="caption" style={{ color: colors.accent, textTransform: 'uppercase' }}>
            {next.start <= now ? 'Happening now' : 'Next class'}
          </Text>
          <Text variant="title2" className="text-ink" style={{ fontVariant: ['tabular-nums'] }}>
            {next.start <= now
              ? `Until ${next.slot.end_time}`
              : `${describeDay(next.start, now)}, ${next.slot.begin_time}`}
          </Text>
          <Text variant="subhead" style={{ color: colors.ink2 }}>
            {[next.group.name, next.slot.classroom && `Room ${next.slot.classroom}`].filter(Boolean).join(' · ')}
          </Text>
        </View>
      )}

      {profile.groups.length === 0 ? (
        <View className="items-center gap-2 px-4 py-16">
          <Text variant="title3" className="text-ink">
            No classes yet
          </Text>
          <Text variant="subhead" style={{ color: colors.ink2, textAlign: 'center' }}>
            When the office adds you to a group, it shows up here with its schedule.
          </Text>
        </View>
      ) : (
        profile.groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            showTeachers
            attendance={attendance.data?.groups.find((g) => g.group_id === group.id)}
            onAttendance={() =>
              router.push({ pathname: '/my-attendance/[groupId]', params: { groupId: String(group.id) } })
            }
          />
        ))
      )}
    </ScrollView>
  );
}
