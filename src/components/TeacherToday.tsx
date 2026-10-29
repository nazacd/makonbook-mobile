import { router } from 'expo-router';
import { CalendarX, ChevronLeft, ChevronRight, DoorOpen, Users, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConnectionLine } from '@/components/ConnectionLine';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Notice } from '@/components/Notice';
import { EmptyState, ErrorState, Skeleton } from '@/components/States';
import { Text } from '@/components/Text';
import { useColors, type Palette } from '@/design/colors';
import * as haptics from '@/design/haptics';
import { fonts } from '@/design/typography';
import { useOpenSession, useTeacherLessons } from '@/lib/api/attendance';
import { describeError } from '@/lib/api/errors';
import { useMe } from '@/lib/api/queries';
import type { Profile, TeacherLesson } from '@/lib/api/types';
import { useNow } from '@/lib/clock';
import { parseClassName, roomNumber, teacherTitle } from '@/lib/groups';
import { addDays, formatDate, schoolClock, schoolDate } from '@/lib/schedule';

const LOGO = require('../../assets/makonbook-icon.png');

// The server keeps lesson days from 7 days back to 14 ahead.
const MIN_OFFSET = -7;
const MAX_OFFSET = 14;
const OPENS_BEFORE_MS = 15 * 60_000;
const RAIL = 56; // width of the time column

type Phase = 'open' | 'finished' | 'disabled' | 'upcoming' | 'startable' | 'missed';

function phaseOf(lesson: TeacherLesson, now: number): Phase {
  if (lesson.session) return lesson.session.status;
  if (!lesson.attendance_enabled) return 'disabled';
  const start = Date.parse(lesson.starts_at);
  if (now < start - OPENS_BEFORE_MS) return 'upcoming';
  if (now <= Date.parse(lesson.ends_at)) return 'startable';
  return 'missed';
}

function relativeDay(offset: number): string | null {
  if (offset === 0) return 'Today';
  if (offset === -1) return 'Yesterday';
  if (offset === 1) return 'Tomorrow';
  return null;
}

// The teacher's home: the day as a timeline, each lesson a stop on the rail.
export function TeacherToday() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const profile = useMe().data as Profile;
  const now = useNow();
  const [offset, setOffset] = useState(0);
  const [startError, setStartError] = useState<{ groupId: number; message: string } | null>(null);
  const date = addDays(schoolDate(now), offset);
  const lessons = useTeacherLessons(date, offset === 0);
  const open = useOpenSession();
  const relative = relativeDay(offset);

  function start(lesson: TeacherLesson) {
    setStartError(null);
    open.mutate(
      { group_id: lesson.group_id, date },
      {
        onSuccess: (s) => router.push({ pathname: '/attendance/[id]', params: { id: s.id } }),
        onError: (e) => {
          haptics.error();
          setStartError({ groupId: lesson.group_id, message: describeError(e) });
        },
      },
    );
  }

  const list = lessons.data?.lessons ?? [];
  // "Now" sits before the first lesson that hasn't ended, on today only.
  const nowIndex = offset === 0 ? list.findIndex((l) => Date.parse(l.ends_at) > now) : -1;
  const inProgress = nowIndex >= 0 && Date.parse(list[nowIndex].starts_at) <= now;

  return (
    <ScrollView
      className="flex-1 bg-brand"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 48, paddingHorizontal: 20, gap: 28 }}
      refreshControl={
        <RefreshControl
          refreshing={lessons.isRefetching}
          onRefresh={() => lessons.refetch()}
          tintColor={colors.ink2}
          colors={[colors.ink]}
          progressBackgroundColor={colors.surface}
        />
      }>
      <View className="flex-row items-center justify-between" style={{ minHeight: 44 }}>
        <View className="flex-row items-center gap-2" accessibilityRole="header" accessible accessibilityLabel="MakonBook, Today">
          <Image source={LOGO} style={{ width: 30, height: 30 }} resizeMode="contain" accessibilityIgnoresInvertColors />
          <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: fonts.displayBold, fontSize: 19, color: colors.ink }}>
            MakonBook
          </Text>
        </View>
        <Pressable onPress={() => router.navigate('/profile')} hitSlop={6} accessibilityRole="button" accessibilityLabel={`${profile.first_name} ${profile.last_name}, profile`}>
          <Avatar kind="teacher" firstName={profile.first_name} lastName={profile.last_name} id={profile.id} />
        </Pressable>
      </View>

      <ConnectionLine />

      <View className="gap-1">
        <Text variant="largeTitle" style={{ color: colors.ink }} accessibilityRole="header">
          {relative ?? formatDate(date)}
        </Text>
        <View className="flex-row items-center justify-between gap-3">
          <Text variant="subhead" style={{ color: colors.ink2, flexShrink: 1 }}>
            {relative ? formatDate(date) : ''}
          </Text>
          <View className="flex-row items-center gap-1">
            <DayButton icon={ChevronLeft} hint="Previous day" disabled={offset <= MIN_OFFSET} onPress={() => setOffset(offset - 1)} />
            {offset !== 0 && <DayButton label="Today" hint="Back to today" onPress={() => setOffset(0)} />}
            <DayButton icon={ChevronRight} hint="Next day" disabled={offset >= MAX_OFFSET} onPress={() => setOffset(offset + 1)} />
          </View>
        </View>
      </View>

      {lessons.isPending ? (
        <View className="gap-6">
          {[0, 1, 2].map((i) => (
            <View key={i} className="flex-row gap-4">
              <Skeleton width={RAIL - 12} height={20} />
              <View className="flex-1 gap-2">
                <Skeleton width="70%" height={20} />
                <Skeleton width="45%" />
              </View>
            </View>
          ))}
        </View>
      ) : lessons.isError ? (
        <ErrorState title="Couldn’t load your lessons" message={describeError(lessons.error)} onRetry={() => lessons.refetch()} retrying={lessons.isFetching} />
      ) : list.length === 0 ? (
        <EmptyState icon={CalendarX} title="No lessons" message="Nothing on your HolliHop schedule for this day." />
      ) : (
        <View>
          {list.map((lesson, i) => (
            <View key={lesson.group_id}>
              {i === nowIndex && !inProgress && <NowMarker now={now} />}
              <Stop
                lesson={lesson}
                phase={phaseOf(lesson, now)}
                last={i === list.length - 1}
                starting={open.isPending && open.variables?.group_id === lesson.group_id}
                error={startError?.groupId === lesson.group_id ? startError.message : null}
                onStart={() => start(lesson)}
              />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function DayButton({ icon, label, hint, disabled, onPress }: { icon?: LucideIcon; label?: string; hint: string; disabled?: boolean; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={hint}
      accessibilityState={{ disabled }}
      style={({ pressed }) => ({
        minWidth: 44,
        height: 44,
        paddingHorizontal: label ? 14 : 0,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? colors.line : colors.surface2,
        opacity: disabled ? 0.35 : 1,
      })}>
      {icon ? (
        <Icon as={icon} size={20} color={colors.ink} strokeWidth={2} />
      ) : (
        <Text variant="subhead" maxFontSizeMultiplier={1.3} style={{ color: colors.ink, fontWeight: '600' }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

function NowMarker({ now }: { now: number }) {
  const colors = useColors();
  return (
    <View className="flex-row items-center" style={{ height: 28 }} accessible accessibilityLabel={`Now, ${schoolClock(now)}`}>
      <Text variant="caption" style={{ width: RAIL, color: colors.accent, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
        {schoolClock(now)}
      </Text>
      <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.accent, marginLeft: -4 }} />
      <View style={{ flex: 1, height: 1.5, backgroundColor: colors.accent, opacity: 0.6 }} />
    </View>
  );
}

const DOT: Record<Phase, keyof Palette> = {
  open: 'accent',
  startable: 'accent',
  finished: 'fillGood',
  missed: 'watch',
  upcoming: 'lineStrong',
  disabled: 'lineStrong',
};

function Stop({
  lesson,
  phase,
  last,
  starting,
  error,
  onStart,
}: {
  lesson: TeacherLesson;
  phase: Phase;
  last: boolean;
  starting: boolean;
  error: string | null;
  onStart: () => void;
}) {
  const colors = useColors();
  const name = parseClassName(lesson.group_name, lesson.discipline);
  const title = teacherTitle(name);
  const openSession = () => lesson.session && router.push({ pathname: '/attendance/[id]', params: { id: lesson.session.id } });
  const status: Partial<Record<Phase, { text: string; tone: keyof Palette }>> = {
    open: { text: 'In progress', tone: 'accent' },
    finished: { text: 'Done', tone: 'good' },
    missed: { text: 'Not taken', tone: 'watch' },
    upcoming: { text: `Opens at ${schoolClock(Date.parse(lesson.starts_at) - OPENS_BEFORE_MS)}`, tone: 'ink3' },
    disabled: { text: 'No attendance in the app', tone: 'ink3' },
  };
  const s = status[phase];

  const body = (
    <View className="flex-1 gap-1.5" style={{ paddingBottom: last ? 0 : 32 }}>
      <Text variant="title3" style={{ color: colors.ink }}>
        {title}
      </Text>
      <View className="flex-row flex-wrap items-center" style={{ columnGap: 14, rowGap: 4 }}>
        <Meta icon={Users} text={String(lesson.students)} label={`${lesson.students} ${lesson.students === 1 ? 'student' : 'students'}`} />
        {lesson.classroom ? <Meta icon={DoorOpen} text={roomNumber(lesson.classroom)} label={`Room ${roomNumber(lesson.classroom)}`} /> : null}
        {s && (
          <Text variant="subhead" style={{ color: colors[s.tone], fontWeight: s.tone === 'ink3' ? '400' : '600' }}>
            {s.text}
          </Text>
        )}
      </View>
      {phase === 'startable' && <Button label="Start attendance" onPress={onStart} loading={starting} style={{ marginTop: 8 }} />}
      {phase === 'open' && <Button label="Continue attendance" onPress={openSession} style={{ marginTop: 8 }} />}
      {error && (
        <View style={{ marginTop: 8 }}>
          <Notice tone="error" title="Couldn’t start attendance" message={error} />
        </View>
      )}
    </View>
  );

  return (
    <View className="flex-row">
      <View style={{ width: RAIL, paddingTop: 2 }}>
        <Text style={{ fontFamily: fonts.displaySemiBold, fontSize: 17, lineHeight: 22, color: colors.ink, fontVariant: ['tabular-nums'] }} maxFontSizeMultiplier={1.2}>
          {lesson.begin_time}
        </Text>
        <Text variant="caption" style={{ color: colors.ink3, fontVariant: ['tabular-nums'] }}>
          {lesson.end_time}
        </Text>
      </View>
      {/* The rail: a dot coloured by the lesson's state, joined to the next stop. */}
      <View style={{ width: 20, alignItems: 'center' }}>
        <View style={{ width: 11, height: 11, borderRadius: 6, marginTop: 6, backgroundColor: colors[DOT[phase]] }} />
        {!last && <View style={{ flex: 1, width: 1.5, backgroundColor: colors.line, marginTop: 4 }} />}
      </View>
      {phase === 'finished' ? (
        <Pressable
          onPress={openSession}
          className="flex-1"
          accessibilityRole="button"
          accessibilityHint="Shows the marks; you can correct them for 24 hours"
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, flexDirection: 'row', paddingLeft: 10 })}>
          {body}
          <View style={{ paddingTop: 4 }}>
            <Icon as={ChevronRight} size={18} color={colors.ink3} />
          </View>
        </Pressable>
      ) : (
        <View className="flex-1 flex-row" style={{ paddingLeft: 10 }}>
          {body}
        </View>
      )}
    </View>
  );
}

function Meta({ icon, text, label }: { icon: LucideIcon; text: string; label: string }) {
  const colors = useColors();
  return (
    <View className="flex-row items-center gap-1.5" accessible accessibilityLabel={label}>
      <Icon as={icon} size={15} color={colors.ink3} />
      <Text variant="subhead" style={{ color: colors.ink2 }}>
        {text}
      </Text>
    </View>
  );
}
