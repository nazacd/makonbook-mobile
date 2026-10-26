import { router, useFocusEffect, useNavigation } from 'expo-router';
import { Bell, ChevronRight, Users } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { groupTitle, TeacherGroupRow } from '@/components/TeacherGroupRow';
import { EmptyState } from '@/components/States';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import { useMe } from '@/lib/api/queries';
import type { Group, Profile } from '@/lib/api/types';
import { useNow } from '@/lib/clock';
import { useLastVisit, useMarkVisited, usePracticeSummary, type GroupSummary } from '@/lib/practice/summary';
import { addDays, formatDate, pastDay, schoolClock, schoolDate } from '@/lib/schedule';

const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** "since 14:20", "since yesterday", "since Monday", "since Mon, 12 Oct". */
export function sinceLabel(since: number, now: number): string {
  const day = schoolDate(since);
  const today = schoolDate(now);
  if (day === today) return `since ${schoolClock(since)}`;
  if (day === addDays(today, -1)) return 'since yesterday';
  if (day >= addDays(today, -6)) return `since ${WEEKDAY[new Date(`${day}T00:00:00Z`).getUTCDay()]}`;
  return `since ${formatDate(day)}`;
}

// The teacher's Practice tab: what came in since the last visit, then each
// group with how many of its students have practised. The groups show at once
// from the profile; each row's numbers fill in as its results arrive.
export function TeacherPractice() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const profile = useMe().data as Profile; // the signed-in layout only renders with a profile
  const now = useNow();
  const since = useLastVisit();
  const markVisited = useMarkVisited();
  const summary = usePracticeSummary(profile.groups, since, now);
  const [pulling, setPulling] = useState(false);

  // "New" is new since the teacher last left the tab for another tab, not
  // since it opened, so results stay marked until they've been seen. Opening
  // a group or the new results on top keeps this tab selected, so it doesn't
  // count. (A hidden tab is frozen and doesn't re-render: this has to happen
  // as focus is lost.)
  const navigation = useNavigation();
  useFocusEffect(
    useCallback(() => {
      const state = navigation.getState();
      const mine = state?.routes[state.index]?.key;
      return () => {
        const after = navigation.getState();
        if (after && after.routes[after.index]?.key !== mine) markVisited();
      };
    }, [navigation, markVisited]),
  );

  const fresh = summary.fresh.length;

  return (
    <ScrollView
      className="flex-1 bg-brand"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32, paddingHorizontal: 20 }}
      refreshControl={
        <RefreshControl
          refreshing={pulling}
          onRefresh={() => {
            setPulling(true);
            summary.refetch().finally(() => setPulling(false));
          }}
          tintColor={colors.ink2}
          colors={[colors.ink]}
          progressBackgroundColor={colors.surface}
        />
      }>
      {fresh > 0 && since != null && (
        <Pressable
          onPress={() => router.push('/practice/new')}
          accessibilityRole="button"
          style={({ pressed }) => ({ marginHorizontal: -20, paddingHorizontal: 20, marginBottom: 8, backgroundColor: pressed ? colors.surface2 : 'transparent' })}>
          <View className="flex-row items-center gap-3" style={{ minHeight: 52 }}>
            <Icon as={Bell} size={20} color={colors.accent} />
            <Text variant="body" className="flex-1" style={{ color: colors.ink, fontWeight: '500' }}>
              {fresh} new {fresh === 1 ? 'result' : 'results'} {sinceLabel(since, now)}
            </Text>
            <Icon as={ChevronRight} size={18} color={colors.ink3} />
          </View>
        </Pressable>
      )}
      {profile.groups.length === 0 ? (
        <EmptyState icon={Users} title="No groups yet" message="Your groups appear here once you teach one in HolliHop." />
      ) : (
        profile.groups.map((g, i) => <GroupRow key={g.id} group={g} summary={summary.groups[g.id]} now={now} first={i === 0} />)
      )}
    </ScrollView>
  );
}

function GroupRow({ group, summary, now, first }: { group: Group; summary?: GroupSummary; now: number; first: boolean }) {
  const colors = useColors();
  const fresh = summary?.fresh.length ?? 0;
  // Practised since the group's last lesson; nothing while that's still none.
  const practiced = summary?.practiced && summary.since != null ? { count: summary.practiced, day: pastDay(summary.since, now) } : null;
  return (
    <TeacherGroupRow
      group={group}
      first={first}
      onPress={() => router.push({ pathname: '/practice/group/[id]', params: { id: String(group.id), name: groupTitle(group) } })}
      details={[practiced && summary && `${practiced.count} of ${summary.students} practiced since ${pastDay(summary.since!, now, true)}`, fresh > 0 && `${fresh} new`]
        .filter(Boolean)
        .join(', ')}
      right={
        summary &&
        (practiced || fresh > 0) && (
          <View className="items-end gap-1">
            {practiced && (
              <Text variant="subhead" style={{ color: colors.ink, fontWeight: '600', fontVariant: ['tabular-nums'] }}>
                {practiced.count}/{summary.students}
                <Text variant="footnote" style={{ color: colors.ink3, fontWeight: '400' }}>
                  {' '}since {practiced.day}
                </Text>
              </Text>
            )}
            {fresh > 0 && (
              <Text variant="subhead" style={{ color: colors.accent, fontWeight: '600' }}>
                {fresh} new
              </Text>
            )}
          </View>
        )
      }
    />
  );
}
