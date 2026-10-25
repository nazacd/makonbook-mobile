import { Stack, useLocalSearchParams } from 'expo-router';
import { CalendarX, Check, Clock, X, type LucideIcon } from 'lucide-react-native';
import { RefreshControl, ScrollView, View } from 'react-native';

import { attendanceBand } from '@/components/AttendanceBar';
import { Icon } from '@/components/Icon';
import { MARK_LABEL } from '@/components/StateChip';
import { EmptyState, ErrorState, Skeleton } from '@/components/States';
import { Text } from '@/components/Text';
import { useColors, type Palette } from '@/design/colors';
import { useMyAttendance } from '@/lib/api/attendance';
import { describeError } from '@/lib/api/errors';
import type { GroupAttendance } from '@/lib/api/types';
import { parseClassName } from '@/lib/groups';
import { formatDate } from '@/lib/schedule';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Days grouped by month, newest first, as they come from the API.
function byMonth(days: GroupAttendance['days']) {
  const out: { title: string; days: GroupAttendance['days'] }[] = [];
  for (const d of days) {
    const title = `${MONTHS[Number(d.date.slice(5, 7)) - 1]} ${d.date.slice(0, 4)}`;
    if (out.at(-1)?.title !== title) out.push({ title, days: [] });
    out.at(-1)!.days.push(d);
  }
  return out;
}

const MARK: Record<GroupAttendance['days'][number]['state'], { icon: LucideIcon; tone: keyof Palette }> = {
  present: { icon: Check, tone: 'ink3' },
  late: { icon: Clock, tone: 'watch' },
  absent: { icon: X, tone: 'bad' },
};

// A class's own screen: how attendance adds up, then every lesson. The figure
// is coloured by its band; only lateness and absences get a line of their own.
export default function MyAttendanceScreen() {
  const colors = useColors();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const query = useMyAttendance();
  const group = query.data?.groups.find((g) => String(g.group_id) === groupId);
  const title = group ? parseClassName(group.group_name, group.discipline).title : 'Attendance';

  return (
    <ScrollView
      className="flex-1 bg-brand"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 48, gap: 36 }}
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching}
          onRefresh={() => query.refetch()}
          tintColor={colors.ink2}
          colors={[colors.ink]}
          progressBackgroundColor={colors.surface}
        />
      }>
      <Stack.Screen options={{ title }} />

      {query.isPending ? (
        <View className="gap-3">
          <Skeleton width={120} height={40} />
          <Skeleton width="60%" />
          <View style={{ height: 24 }} />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={20} />
          ))}
        </View>
      ) : query.isError ? (
        <ErrorState
          title="Couldn’t load your attendance"
          message={describeError(query.error)}
          onRetry={() => query.refetch()}
          retrying={query.isFetching}
        />
      ) : !group || group.days.length === 0 ? (
        <EmptyState icon={CalendarX} title="No lessons yet" message="Your lessons in this group appear here once they have taken place." />
      ) : (
        <>
          <Overview group={group} />
          {byMonth(group.days).map((month) => (
            <View key={month.title} className="gap-1">
              <Text variant="title3" style={{ color: colors.ink, marginBottom: 6 }} accessibilityRole="header">
                {month.title}
              </Text>
              {month.days.map((d, i) => {
                const mark = MARK[d.state];
                return (
                  <View
                    key={d.date}
                    className="flex-row items-center gap-3"
                    style={{ minHeight: 48, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: colors.line }}
                    accessible
                    accessibilityLabel={`${formatDate(d.date)}: ${MARK_LABEL[d.state]}`}>
                    <Text variant="body" className="flex-1" style={{ color: colors.ink }}>
                      {formatDate(d.date)}
                    </Text>
                    <Icon as={mark.icon} size={16} color={colors[mark.tone]} strokeWidth={2} />
                    <Text variant="subhead" style={{ color: d.state === 'present' ? colors.ink2 : colors[mark.tone], fontWeight: d.state === 'present' ? '400' : '600' }}>
                      {MARK_LABEL[d.state]}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
          <Text variant="footnote" style={{ color: colors.ink3 }}>
            From the school’s records in HolliHop, for the last four months. If something looks wrong, ask your teacher or the office.
          </Text>
        </>
      )}
    </ScrollView>
  );
}

function Overview({ group }: { group: GroupAttendance }) {
  const colors = useColors();
  const { lessons, present, late, absent } = group.summary;
  const rate = (present + late) / lessons;
  const tone: keyof Palette = attendanceBand(rate) === 'bad' ? 'bad' : attendanceBand(rate) === 'watch' ? 'watch' : 'good';
  const problems = [absent > 0 && `${absent} absent`, late > 0 && `${late} late`].filter(Boolean).join(' · ');
  return (
    <View className="gap-1">
      <View className="flex-row items-baseline gap-3">
        <Text variant="largeTitle" style={{ color: colors[tone], fontSize: 48, lineHeight: 54, fontVariant: ['tabular-nums'] }}>
          {Math.round(rate * 100)}%
        </Text>
        <Text variant="subhead" style={{ color: colors.ink2 }}>
          {present + late} of {lessons} lessons
        </Text>
      </View>
      {problems ? (
        <Text variant="callout" style={{ color: colors[tone], fontWeight: '600' }}>
          {problems}
        </Text>
      ) : null}
      <Text variant="caption" selectable style={{ color: colors.ink3, marginTop: 8 }}>
        {group.group_name}
      </Text>
    </View>
  );
}
