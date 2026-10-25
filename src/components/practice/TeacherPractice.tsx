import { router, useFocusEffect, useNavigation } from 'expo-router';
import { ChevronRight, Users } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { EmptyState } from '@/components/States';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import { useMe } from '@/lib/api/queries';
import type { Group, Profile } from '@/lib/api/types';
import { useNow } from '@/lib/clock';
import { dayLetters, parseClassName, teacherTitle } from '@/lib/groups';
import { useLastVisit, useMarkVisited, usePracticeSummary, type GroupSummary } from '@/lib/practice/summary';
import { addDays, formatDate, schoolClock, schoolDate } from '@/lib/schedule';

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
  const summary = usePracticeSummary(
    profile.groups.map((g) => g.id),
    since,
  );
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
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} />
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
        profile.groups.map((g, i) => <GroupRow key={g.id} group={g} summary={summary.groups[g.id]} first={i === 0} />)
      )}
    </ScrollView>
  );
}

function GroupRow({ group, summary, first }: { group: Group; summary?: GroupSummary; first: boolean }) {
  const colors = useColors();
  const name = parseClassName(group.name, group.discipline);
  const title = teacherTitle(name);
  const slot = group.schedule[0];
  const time = slot ? `${slot.begin_time} · ${dayLetters(slot.weekdays)}` : null;
  const dot = name.subject === 'Math' ? colors.math : name.subject === 'English' ? colors.english : colors.ink3;
  const fresh = summary?.fresh.length ?? 0;
  const label = [
    title,
    time,
    summary && `${summary.practiced} of ${summary.students} practiced`,
    fresh > 0 && `${fresh} new`,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/practice/group/[id]', params: { id: String(group.id), name: title } })}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({ marginHorizontal: -20, paddingHorizontal: 20, backgroundColor: pressed ? colors.surface2 : 'transparent' })}>
      <View
        className="flex-row items-center gap-3"
        style={{ minHeight: 72, paddingVertical: 12, borderTopWidth: first ? 0 : 1, borderTopColor: colors.line }}>
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
        {summary && (
          <View className="items-end gap-1">
            <Text variant="subhead" style={{ color: colors.ink2, fontVariant: ['tabular-nums'] }}>
              <Text variant="subhead" style={{ color: colors.ink, fontWeight: '600' }}>
                {summary.practiced}/{summary.students}
              </Text>{' '}
              practiced
            </Text>
            {fresh > 0 && (
              <Text variant="subhead" style={{ color: colors.accent, fontWeight: '600' }}>
                {fresh} new
              </Text>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}
