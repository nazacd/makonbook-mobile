import { router } from 'expo-router';
import { CalendarX, LogOut, MessageSquareText, Moon, Plus, Smartphone, Sun, UserPlus } from 'lucide-react-native';
import { useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { ClassBlock, type ClassBlockLabels } from '@/components/ClassBlock';
import { Icon } from '@/components/Icon';
import { NextClass, type NextClassLabels } from '@/components/NextClass';
import { PageRow } from '@/components/PageRow';
import { SegmentedControl } from '@/components/SegmentedControl';
import { LangSwitch } from '@/components/parent/LangSwitch';
import { EmptyState, ErrorState, Skeleton } from '@/components/States';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import * as haptics from '@/design/haptics';
import { fonts } from '@/design/typography';
import { useAppearance } from '@/lib/appearance';
import { useNow } from '@/lib/clock';
import { confirm } from '@/lib/confirm';
import { normalCase } from '@/lib/groups';
import { useChildAttendance, useChildReports, useChildView } from '@/lib/parent/hooks';
import { dayIn, describeParentError, weekdaysIn } from '@/lib/parent/i18n';
import { useUnseenAnswers } from '@/lib/parent/seen';
import { useParent, type SavedChild } from '@/lib/parent/session';
import { nextClass } from '@/lib/schedule';

const LOGO = require('../../../assets/makonbook-icon.png');

// A parent's home: the child, their next class, their classes with schedule
// and attendance (the figure itself, unlike the student's bar), a way to write
// to the office, and the settings as rows. Every word from the parent strings.
export default function ParentHome() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, lang, kids, selected: kid, select, removeChild } = useParent();
  const view = useChildView(kid);
  const attendance = useChildAttendance(kid);
  const reports = useChildReports(kid);
  const unseen = useUnseenAnswers(kid, reports.data?.reports);
  const now = useNow();
  const [pulling, setPulling] = useState(false);
  const appearance = useAppearance();

  if (!kid) return null; // the guard leaves this screen once no child is left

  const child = view.data?.child ?? kid;
  const name = normalCase(`${child.first_name} ${child.last_name}`);
  const groups = view.data?.groups ?? [];
  const next = nextClass(groups, now);
  const nextLabels: NextClassLabels = {
    happening: t.nowInClass,
    next: t.nextClass,
    day: (start, at) => dayIn(t, lang, start, at),
    until: t.until,
    room: t.room,
  };
  const classLabels: ClassBlockLabels = {
    attendance: t.attendance,
    attendanceA11y: (pct) => `${t.attendance} ${pct}%`,
    room: t.room,
    days: (days) => weekdaysIn(lang, days),
    daysShown: (days) => weekdaysIn(lang, days),
  };

  return (
    <ScrollView
      className="flex-1 bg-brand"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40, paddingHorizontal: 20, gap: 32 }}
      refreshControl={
        <RefreshControl
          refreshing={pulling}
          onRefresh={() => {
            setPulling(true);
            Promise.all([view.refetch(), attendance.refetch(), reports.refetch()]).finally(() => setPulling(false));
          }}
          tintColor={colors.ink2}
          colors={[colors.ink]}
          progressBackgroundColor={colors.surface}
        />
      }>
      <View style={{ gap: 24 }}>
        <View className="flex-row items-center justify-between" style={{ minHeight: 44 }}>
          <View className="flex-row items-center gap-2" accessible accessibilityRole="header" accessibilityLabel={`MakonBook, ${t.parentMode}`}>
            <Image source={LOGO} style={{ width: 28, height: 28 }} resizeMode="contain" accessibilityIgnoresInvertColors />
            <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: fonts.displayBold, fontSize: 18, color: colors.ink }}>
              MakonBook
            </Text>
          </View>
          <LangSwitch />
        </View>

        {kids.length > 1 ? (
          <View style={{ gap: 14 }}>
            <Children kids={kids} selected={kid} onSelect={select} addLabel={t.addChild} />
            <Text variant="title" style={{ color: colors.ink }} accessibilityRole="header">
              {name}
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center gap-3.5">
            <Avatar kind="student" firstName={child.first_name} lastName={child.last_name} id={child.client_id} size={60} />
            <Text variant="title" className="flex-1" style={{ color: colors.ink }} accessibilityRole="header">
              {name}
            </Text>
          </View>
        )}

        {/* Keyed by child: switching shows the blocks afresh, so their objects come in again. */}
        {next && <NextClass key={`next-${kid.client_id}`} next={next} now={now} labels={nextLabels} />}
      </View>

      {view.isPending ? (
        <View className="gap-3">
          <Skeleton width="60%" height={26} />
          <Skeleton width="40%" />
          <Skeleton width="45%" />
        </View>
      ) : view.isError && !view.data ? (
        <ErrorState title={t.loadFailed} message={describeParentError(t, view.error)} onRetry={() => view.refetch()} retrying={view.isFetching} retryLabel={t.tryAgain} />
      ) : groups.length === 0 ? (
        <EmptyState icon={CalendarX} title={t.noClasses} message={t.noClassesBody} />
      ) : (
        groups.map((group) => (
          <ClassBlock
            key={`${kid.client_id}-${group.id}`}
            group={group}
            labels={classLabels}
            showRate
            attendance={attendance.data?.groups.find((g) => g.group_id === group.id)}
            onAttendance={() =>
              router.push({ pathname: '/parent/attendance/[groupId]', params: { groupId: String(group.id), child: String(kid.client_id) } })
            }
          />
        ))
      )}

      <View>
        <PageRow
          icon={MessageSquareText}
          label={t.report}
          onPress={() => router.push({ pathname: '/parent/report', params: { child: String(kid.client_id) } })}
          accessory={
            unseen.length > 0 ? (
              <View className="flex-row items-center gap-1.5" accessibilityLabel={t.answer}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} />
                <Text variant="footnote" style={{ color: colors.accent, fontWeight: '600' }}>
                  {t.answer}
                </Text>
              </View>
            ) : undefined
          }
        />
        <PageRow icon={UserPlus} label={t.addChild} separator onPress={() => router.push('/parent/add')} />
        {/* The same setting as the student's Profile: saved on the phone, for everyone using it. */}
        <View style={{ paddingVertical: 16 }}>
          <SegmentedControl
            accessibilityLabel={t.theme}
            value={appearance.mode}
            onChange={appearance.setMode}
            options={[
              { value: 'system', label: t.themeSystem, icon: Smartphone },
              { value: 'light', label: t.themeLight, icon: Sun },
              { value: 'dark', label: t.themeDark, icon: Moon },
            ]}
          />
        </View>
        <PageRow
          icon={LogOut}
          label={kids.length > 1 ? `${t.remove}: ${normalCase(kid.first_name)}` : t.remove}
          separator
          destructive
          onPress={() =>
            confirm({
              title: t.removeTitle(normalCase(`${kid.first_name} ${kid.last_name}`)),
              message: t.removeBody,
              confirm: t.removeConfirm,
              cancel: t.cancel,
              destructive: true,
              onConfirm: () => void removeChild(kid.client_id),
            })
          }
        />
      </View>
    </ScrollView>
  );
}

// More than one child: their avatars, the one shown ringed, and a "+" to add another.
function Children({ kids, selected, onSelect, addLabel }: { kids: SavedChild[]; selected: SavedChild; onSelect: (id: number) => void; addLabel: string }) {
  const colors = useColors();
  return (
    <View className="flex-row flex-wrap" style={{ gap: 14 }} accessibilityRole="tablist">
      {kids.map((k) => {
        const on = k.client_id === selected.client_id;
        return (
          <Pressable
            key={k.client_id}
            onPress={() => {
              if (on) return;
              haptics.selection();
              onSelect(k.client_id);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={normalCase(`${k.first_name} ${k.last_name}`)}
            style={({ pressed }) => ({ width: 64, alignItems: 'center', gap: 4, opacity: pressed ? 0.7 : 1 })}>
            <View style={{ borderRadius: 30, padding: 3, borderWidth: 2, borderColor: on ? colors.accent : 'transparent', opacity: on ? 1 : 0.6 }}>
              <Avatar kind="student" firstName={k.first_name} lastName={k.last_name} id={k.client_id} size={48} />
            </View>
            <Text variant="footnote" numberOfLines={1} style={{ color: on ? colors.ink : colors.ink3, fontWeight: on ? '600' : '400' }}>
              {normalCase(k.first_name)}
            </Text>
          </Pressable>
        );
      })}
      <Pressable
        onPress={() => router.push('/parent/add')}
        accessibilityRole="button"
        accessibilityLabel={addLabel}
        style={({ pressed }) => ({ width: 64, alignItems: 'center', paddingTop: 5, opacity: pressed ? 0.7 : 1 })}>
        <View style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' }}>
          <Icon as={Plus} size={20} color={colors.ink3} />
        </View>
      </Pressable>
    </View>
  );
}
