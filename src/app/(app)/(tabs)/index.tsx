import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GroupCard } from '@/components/GroupCard';
import { Text } from '@/components/Text';
import { colors } from '@/design/colors';
import { webTabBarInset } from '@/design/navigation';
import { useMe } from '@/lib/api/queries';
import type { Profile } from '@/lib/api/types';
import { useNow } from '@/lib/clock';
import { describeDay, nextClass } from '@/lib/schedule';

export default function ClassesScreen() {
  const insets = useSafeAreaInsets();
  const me = useMe();
  const profile = me.data as Profile; // the signed-in layout only renders with a profile
  const now = useNow();
  const next = nextClass(profile.groups, now);
  const teacher = profile.kind === 'teacher';

  return (
    <ScrollView
      className="flex-1 bg-brand"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingTop: insets.top + webTabBarInset + 12, paddingBottom: 32 }}
      contentContainerClassName="gap-4 px-5"
      refreshControl={
        <RefreshControl
          refreshing={me.isRefetching}
          onRefresh={() => me.refetch()}
          tintColor={colors.accent}
          colors={[colors.accent]}
          progressBackgroundColor={colors.surface}
        />
      }>
      <View className="gap-1 pb-2">
        <Text variant="subhead" style={{ color: colors.secondaryText }}>
          Hi, {profile.first_name}
        </Text>
        <Text variant="largeTitle" className="text-white" accessibilityRole="header">
          {teacher ? 'Your groups' : 'Classes'}
        </Text>
      </View>

      {next && (
        <View
          className="gap-1 rounded-3xl px-5 py-5"
          style={{ backgroundColor: 'rgba(139, 92, 246, 0.16)' }}
          accessibilityRole="summary">
          <Text variant="caption" style={{ color: colors.accent, textTransform: 'uppercase' }}>
            {next.start <= now ? 'Happening now' : 'Next class'}
          </Text>
          <Text variant="title2" className="text-white" style={{ fontVariant: ['tabular-nums'] }}>
            {next.start <= now
              ? `Until ${next.slot.end_time}`
              : `${describeDay(next.start, now)}, ${next.slot.begin_time}`}
          </Text>
          <Text variant="subhead" style={{ color: colors.secondaryText }}>
            {[next.group.name, next.slot.classroom && `Room ${next.slot.classroom}`].filter(Boolean).join(' · ')}
          </Text>
        </View>
      )}

      {profile.groups.length === 0 ? (
        <View className="items-center gap-2 px-4 py-16">
          <Text variant="title3" className="text-white">
            No classes yet
          </Text>
          <Text variant="subhead" style={{ color: colors.secondaryText, textAlign: 'center' }}>
            {teacher
              ? 'Groups you teach appear here once the office schedules them.'
              : 'When the office adds you to a group, it shows up here with its schedule.'}
          </Text>
        </View>
      ) : (
        profile.groups.map((group) => <GroupCard key={group.id} group={group} showTeachers={!teacher} />)
      )}
    </ScrollView>
  );
}
