import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, View } from 'react-native';

import { Notice } from '@/components/Notice';
import { MARK_COLOR, StateChip } from '@/components/StateChip';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import type { GroupAttendance } from '@/lib/api/types';
import { useChildAttendance } from '@/lib/parent/hooks';
import { dateIn, describeParentError, monthIn, type Lang, type Strings } from '@/lib/parent/i18n';
import { useParent } from '@/lib/parent/session';

function byMonth(lang: Lang, days: GroupAttendance['days']) {
  const out: { title: string; days: GroupAttendance['days'] }[] = [];
  for (const d of days) {
    const title = monthIn(lang, d.date);
    if (out.at(-1)?.title !== title) out.push({ title, days: [] });
    out.at(-1)!.days.push(d);
  }
  return out;
}

// The child's attendance in one group, as the student sees their own
// (my-attendance/[groupId]), in the parent's language.
export default function ChildAttendanceScreen() {
  const colors = useColors();
  const { groupId, child } = useLocalSearchParams<{ groupId: string; child: string }>();
  const { t, lang, kids } = useParent();
  const kid = kids.find((k) => String(k.client_id) === child);
  const query = useChildAttendance(kid);
  const group = query.data?.groups.find((g) => String(g.group_id) === groupId);
  const label = { present: t.present, late: t.late, absent: t.absent };

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
      <Stack.Screen options={{ title: group?.group_name ?? t.attendance }} />

      {query.isPending ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 48 }} />
      ) : query.isError ? (
        <Notice tone="error" title={t.loadFailed} message={describeParentError(t, query.error)} />
      ) : !group || group.days.length === 0 ? (
        <View className="items-center gap-2 px-4 py-16">
          <Text variant="title3" className="text-ink">
            {t.noLessons}
          </Text>
          <Text variant="subhead" style={{ color: colors.ink2, textAlign: 'center' }}>
            {t.noLessonsBody}
          </Text>
        </View>
      ) : (
        <>
          <Overview group={group} t={t} />
          {byMonth(lang, group.days).map((month) => (
            <View key={month.title} className="gap-2">
              <Text variant="footnote" className="px-5" style={{ color: colors.ink2, textTransform: 'uppercase' }}>
                {month.title}
              </Text>
              <View className="overflow-hidden rounded-2xl bg-surface">
                {month.days.map((d, i) => (
                  <View
                    key={d.date}
                    className="ml-5 min-h-[50px] flex-row items-center pr-4"
                    style={i > 0 ? { borderTopWidth: 1, borderTopColor: colors.line } : undefined}
                    accessible
                    accessibilityLabel={`${dateIn(lang, d.date)}: ${label[d.state]}`}>
                    <Text variant="body" className="flex-1 text-ink">
                      {dateIn(lang, d.date)}
                    </Text>
                    <StateChip label={label[d.state]} color={colors[MARK_COLOR[d.state]]} />
                  </View>
                ))}
              </View>
            </View>
          ))}
          <Text variant="footnote" style={{ color: colors.ink3 }}>
            {t.attendanceSource}
          </Text>
        </>
      )}
    </ScrollView>
  );
}

function Overview({ group, t }: { group: GroupAttendance; t: Strings }) {
  const colors = useColors();
  const { lessons, present, late, absent } = group.summary;
  const rate = Math.round(((present + late) / Math.max(1, lessons)) * 100);
  return (
    <View className="gap-3">
      <View>
        <Text variant="largeTitle" className="text-ink" style={{ fontVariant: ['tabular-nums'] }}>
          {rate}%
        </Text>
        <Text variant="subhead" style={{ color: colors.ink2 }}>
          {t.attendedLine(present + late, lessons)}
        </Text>
      </View>
      <View className="flex-row gap-3">
        <Tile label={t.presentTile} value={present} color={colors.good} />
        <Tile label={t.lateTile} value={late} color={colors.watch} />
        <Tile label={t.absentTile} value={absent} color={colors.bad} />
      </View>
    </View>
  );
}

function Tile({ label, value, color }: { label: string; value: number; color: string }) {
  const colors = useColors();
  return (
    <View className="flex-1 gap-1 rounded-2xl bg-surface p-4">
      <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      <Text variant="title2" className="text-ink" style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
      <Text variant="footnote" style={{ color: colors.ink2 }}>
        {label}
      </Text>
    </View>
  );
}
