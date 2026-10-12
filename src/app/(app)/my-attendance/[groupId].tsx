import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, View } from 'react-native';

import { Notice } from '@/components/Notice';
import { MARK_COLOR, MARK_LABEL, StateChip } from '@/components/StateChip';
import { Text } from '@/components/Text';
import { colors } from '@/design/colors';
import { useMyAttendance } from '@/lib/api/attendance';
import { describeError } from '@/lib/api/errors';
import type { GroupAttendance } from '@/lib/api/types';
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

// A student's attendance in one group: how it adds up, then every lesson.
export default function MyAttendanceScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const query = useMyAttendance();
  const group = query.data?.groups.find((g) => String(g.group_id) === groupId);

  return (
    <ScrollView
      className="flex-1 bg-brand"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-6 px-5 pb-12 pt-4"
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching}
          onRefresh={() => query.refetch()}
          tintColor={colors.accent}
          colors={[colors.accent]}
          progressBackgroundColor={colors.surface}
        />
      }>
      <Stack.Screen options={{ title: group?.group_name ?? 'Attendance' }} />

      {query.isPending ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 48 }} />
      ) : query.isError ? (
        <Notice tone="error" title="Couldn’t load your attendance" message={describeError(query.error)} />
      ) : !group || group.days.length === 0 ? (
        <View className="items-center gap-2 px-4 py-16">
          <Text variant="title3" className="text-white">
            No lessons yet
          </Text>
          <Text variant="subhead" style={{ color: colors.secondaryText, textAlign: 'center' }}>
            Your lessons in this group appear here once they have taken place.
          </Text>
        </View>
      ) : (
        <>
          <Overview group={group} />
          {byMonth(group.days).map((month) => (
            <View key={month.title} className="gap-2">
              <Text variant="footnote" className="px-5" style={{ color: colors.secondaryText, textTransform: 'uppercase' }}>
                {month.title}
              </Text>
              <View className="overflow-hidden rounded-2xl bg-surface">
                {month.days.map((d, i) => (
                  <View
                    key={d.date}
                    className="ml-5 min-h-[50px] flex-row items-center pr-4"
                    style={i > 0 ? { borderTopWidth: 1, borderTopColor: colors.separator } : undefined}
                    accessible
                    accessibilityLabel={`${formatDate(d.date)}: ${MARK_LABEL[d.state]}`}>
                    <Text variant="body" className="flex-1 text-white">
                      {formatDate(d.date)}
                    </Text>
                    <StateChip label={MARK_LABEL[d.state]} color={MARK_COLOR[d.state]} />
                  </View>
                ))}
              </View>
            </View>
          ))}
          <Text variant="footnote" style={{ color: colors.tertiaryText }}>
            From the school’s records in HolliHop, for the last four months. Today’s lesson shows as soon as you’re
            checked in. If something looks wrong, ask your teacher or the office.
          </Text>
        </>
      )}
    </ScrollView>
  );
}

function Overview({ group }: { group: GroupAttendance }) {
  const { lessons, present, late, absent } = group.summary;
  const rate = Math.round(((present + late) / lessons) * 100);
  return (
    <View className="gap-3">
      <View>
        <Text variant="largeTitle" className="text-white" style={{ fontVariant: ['tabular-nums'] }}>
          {rate}%
        </Text>
        <Text variant="subhead" style={{ color: colors.secondaryText }}>
          attended — {present + late} of {lessons} lessons
        </Text>
      </View>
      <View className="flex-row gap-3">
        <Tile label="Present" value={present} color={colors.success} />
        <Tile label="Late" value={late} color={colors.warning} />
        <Tile label="Absent" value={absent} color={colors.danger} />
      </View>
    </View>
  );
}

function Tile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View className="flex-1 gap-1 rounded-2xl bg-surface p-4">
      <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      <Text variant="title2" className="text-white" style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
      <Text variant="footnote" style={{ color: colors.secondaryText }}>
        {label}
      </Text>
    </View>
  );
}
