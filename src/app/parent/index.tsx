import { router } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { roomNumber } from '@/lib/groups';

import { Button } from '@/components/Button';
import { GroupCard, type GroupCardLabels } from '@/components/GroupCard';
import { ListRow } from '@/components/ListRow';
import { Notice } from '@/components/Notice';
import { LangSwitch } from '@/components/parent/LangSwitch';
import { PressableScale } from '@/components/PressableScale';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import * as haptics from '@/design/haptics';
import { useNow } from '@/lib/clock';
import { confirm } from '@/lib/confirm';
import { useChildAttendance, useChildView } from '@/lib/parent/hooks';
import { dayIn, describeParentError, weekdaysIn } from '@/lib/parent/i18n';
import { useParent } from '@/lib/parent/session';
import { nextClass } from '@/lib/schedule';

// A parent's home: the child's next class, their classes with schedule and
// attendance, a way to tell the office about a problem, and the settings.
export default function ParentHome() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, lang, kids, selected: kid, select, removeChild } = useParent();
  const view = useChildView(kid);
  const attendance = useChildAttendance(kid);
  const now = useNow();

  if (!kid) return null; // the guard leaves this screen once no child is left

  const child = view.data?.child ?? kid;
  const groups = view.data?.groups ?? [];
  const next = nextClass(groups, now);
  const labels: GroupCardLabels = {
    weekdays: (days) => weekdaysIn(lang, days),
    room: t.room,
    attendance: t.attendance,
    noLessons: t.noLessonsRecorded,
    attended: t.attendedOf,
    late: t.lateCount,
    absent: t.absentCount,
  };

  return (
    <ScrollView
      className="flex-1 bg-brand"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }}
      contentContainerClassName="gap-4 px-5"
      refreshControl={
        <RefreshControl
          refreshing={view.isRefetching || attendance.isRefetching}
          onRefresh={() => {
            view.refetch();
            attendance.refetch();
          }}
          tintColor={colors.accent}
          colors={[colors.accent]}
          progressBackgroundColor={colors.surface}
        />
      }>
      <View className="gap-1 pb-2">
        <View className="flex-row items-center justify-between gap-3">
          <Text variant="subhead" style={{ color: colors.ink2 }}>
            {t.parentMode}
          </Text>
          <LangSwitch />
        </View>
        <Text variant="largeTitle" className="text-ink" accessibilityRole="header">
          {child.first_name} {child.last_name}
        </Text>
      </View>

      {kids.length > 1 && (
        <View className="flex-row flex-wrap gap-2" accessibilityRole="tablist">
          {kids.map((k) => {
            const on = k.client_id === kid.client_id;
            return (
              <PressableScale
                key={k.client_id}
                className={`h-9 items-center justify-center rounded-full px-4 ${on ? 'bg-primary' : 'bg-surface'}`}
                onPress={() => {
                  if (on) return;
                  haptics.selection();
                  select(k.client_id);
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}>
                <Text variant="subhead" style={{ color: on ? colors.onPrimary : colors.ink2, fontWeight: '600' }}>
                  {k.first_name}
                </Text>
              </PressableScale>
            );
          })}
        </View>
      )}

      {view.isPending ? (
        <ActivityIndicator color={colors.accent} style={{ marginVertical: 48 }} />
      ) : view.isError && !view.data ? (
        <View className="gap-3">
          <Notice tone="error" title={t.loadFailed} message={describeParentError(t, view.error)} />
          <Button label={t.tryAgain} variant="secondary" onPress={() => view.refetch()} loading={view.isFetching} />
        </View>
      ) : (
        <>
          {next && (
            <View
              className="gap-1 rounded-3xl px-5 py-5"
              style={{ backgroundColor: colors.accentTint }}
              accessibilityRole="summary">
              <Text variant="caption" style={{ color: colors.accent, textTransform: 'uppercase' }}>
                {next.start <= now ? t.nowInClass : t.nextClass}
              </Text>
              <Text variant="title2" className="text-ink" style={{ fontVariant: ['tabular-nums'] }}>
                {next.start <= now
                  ? t.until(next.slot.end_time)
                  : `${dayIn(t, lang, next.start, now)}, ${next.slot.begin_time}`}
              </Text>
              <Text variant="subhead" style={{ color: colors.ink2 }}>
                {[next.group.name, next.slot.classroom && t.room(roomNumber(next.slot.classroom))].filter(Boolean).join(' · ')}
              </Text>
            </View>
          )}

          {groups.length === 0 ? (
            <View className="items-center gap-2 px-4 py-12">
              <Text variant="title3" className="text-ink">
                {t.noClasses}
              </Text>
              <Text variant="subhead" style={{ color: colors.ink2, textAlign: 'center' }}>
                {t.noClassesBody}
              </Text>
            </View>
          ) : (
            groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                showTeachers
                labels={labels}
                attendance={attendance.data?.groups.find((g) => g.group_id === group.id)}
                onAttendance={() =>
                  router.push({
                    pathname: '/parent/attendance/[groupId]',
                    params: { groupId: String(group.id), child: String(kid.client_id) },
                  })
                }
              />
            ))
          )}
        </>
      )}

      <Button
        label={t.report}
        variant="secondary"
        onPress={() => router.push({ pathname: '/parent/report', params: { child: String(kid.client_id) } })}
      />

      <View className="gap-2 pt-4">
        <Text variant="footnote" className="px-5" style={{ color: colors.ink2, textTransform: 'uppercase' }}>
          {t.settings}
        </Text>
        <View className="overflow-hidden rounded-2xl bg-surface">
          <ListRow label={t.addChild} onPress={() => router.push('/parent/add')} />
          <ListRow label={t.studentSignIn} separator onPress={() => router.push('/sign-in')} />
          <ListRow
            label={`${t.remove}: ${kid.first_name}`}
            separator
            destructive
            onPress={() =>
              confirm({
                title: t.removeTitle(`${kid.first_name} ${kid.last_name}`),
                message: t.removeBody,
                confirm: t.removeConfirm,
                cancel: t.cancel,
                destructive: true,
                onConfirm: () => void removeChild(kid.client_id),
              })
            }
          />
        </View>
        <Text variant="footnote" className="px-5" style={{ color: colors.ink3 }}>
          {t.readOnly}
        </Text>
      </View>
    </ScrollView>
  );
}
