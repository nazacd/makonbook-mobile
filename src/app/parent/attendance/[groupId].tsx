import { router, Stack, useLocalSearchParams } from 'expo-router';
import { CalendarX, Check, Clock, X, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { attendanceBand } from '@/components/AttendanceBar';
import { Icon } from '@/components/Icon';
import { EmptyState, ErrorState, Skeleton } from '@/components/States';
import { Text } from '@/components/Text';
import { useColors, type Palette } from '@/design/colors';
import { fonts } from '@/design/typography';
import type { GroupAttendance } from '@/lib/api/types';
import { parseClassName } from '@/lib/groups';
import { useChildAttendance } from '@/lib/parent/hooks';
import { dateIn, describeParentError, monthIn, type Lang } from '@/lib/parent/i18n';
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

const MARK: Record<GroupAttendance['days'][number]['state'], { icon: LucideIcon; tone: keyof Palette }> = {
  present: { icon: Check, tone: 'ink3' },
  late: { icon: Clock, tone: 'watch' },
  absent: { icon: X, tone: 'bad' },
};

// The child's attendance in one group, as the student sees their own
// (my-attendance/[groupId]), in the parent's language: the figure in its band
// colour with the bar, then every lesson.
export default function ChildAttendanceScreen() {
  const colors = useColors();
  const { groupId, child } = useLocalSearchParams<{ groupId: string; child: string }>();
  const { t, lang, kids } = useParent();
  const kid = kids.find((k) => String(k.client_id) === child);
  const query = useChildAttendance(kid);
  const [pulling, setPulling] = useState(false);
  const group = query.data?.groups.find((g) => String(g.group_id) === groupId);
  const label = { present: t.present, late: t.late, absent: t.absent };

  return (
    <ScrollView
      className="flex-1 bg-brand"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 48, gap: 36 }}
      refreshControl={
        <RefreshControl
          refreshing={pulling}
          onRefresh={() => {
            setPulling(true);
            query.refetch().finally(() => setPulling(false));
          }}
          tintColor={colors.ink2}
          colors={[colors.ink]}
          progressBackgroundColor={colors.surface}
        />
      }>
      <Stack.Screen options={{ title: group ? parseClassName(group.group_name, group.discipline).title : t.attendance }} />

      {query.isPending ? (
        <View className="gap-3">
          <Skeleton width={120} height={56} />
          <Skeleton width={160} height={10} />
          <View style={{ height: 24 }} />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={20} />
          ))}
        </View>
      ) : query.isError ? (
        <ErrorState title={t.loadFailed} message={describeParentError(t, query.error)} onRetry={() => query.refetch()} retrying={query.isFetching} retryLabel={t.tryAgain} />
      ) : !group || group.days.length === 0 ? (
        <EmptyState icon={CalendarX} title={t.noLessons} message={t.noLessonsBody} />
      ) : (
        <>
          <Overview group={group} label={t.attendance} />
          {byMonth(lang, group.days).map((month) => (
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
                    accessibilityLabel={`${dateIn(lang, d.date)}: ${label[d.state]}`}>
                    <Text variant="body" className="flex-1" style={{ color: colors.ink }}>
                      {dateIn(lang, d.date)}
                    </Text>
                    <Icon as={mark.icon} size={16} color={colors[mark.tone]} strokeWidth={2} />
                    <Text variant="subhead" style={{ color: d.state === 'present' ? colors.ink2 : colors[mark.tone], fontWeight: d.state === 'present' ? '400' : '600' }}>
                      {label[d.state]}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
          <Text
            variant="footnote"
            accessibilityRole="link"
            onPress={() => router.push({ pathname: '/parent/report', params: { child: String(child) } })}
            style={{ color: colors.accent, fontWeight: '600' }}>
            {t.attendanceSource}
          </Text>
        </>
      )}
    </ScrollView>
  );
}

// Only the figure, in its band colour, with a larger bar under it.
function Overview({ group, label }: { group: GroupAttendance; label: string }) {
  const colors = useColors();
  const { lessons, present, late } = group.summary;
  const rate = (present + late) / Math.max(1, lessons);
  const band = attendanceBand(rate);
  const tone: keyof Palette = band === 'bad' ? 'bad' : band === 'watch' ? 'watch' : 'good';
  const fill: keyof Palette = band === 'bad' ? 'fillBad' : band === 'watch' ? 'fillWatch' : 'fillGood';
  const pct = Math.round(rate * 100);
  return (
    <View accessible accessibilityLabel={`${label} ${pct}%`}>
      <Text style={{ fontFamily: fonts.displayBold, fontSize: 56, lineHeight: 62, color: colors[tone], fontVariant: ['tabular-nums'] }} maxFontSizeMultiplier={1.2}>
        {pct}%
      </Text>
      <View style={{ width: 160, height: 10, borderRadius: 5, backgroundColor: colors.track, overflow: 'hidden', marginTop: 10 }}>
        <View style={{ width: `${pct}%`, height: 10, borderRadius: 5, backgroundColor: colors[fill] }} />
      </View>
    </View>
  );
}
