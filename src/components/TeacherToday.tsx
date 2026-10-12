import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Notice } from '@/components/Notice';
import { PressableScale } from '@/components/PressableScale';
import { StateChip } from '@/components/StateChip';
import { Text } from '@/components/Text';
import { colors } from '@/design/colors';
import * as haptics from '@/design/haptics';
import { useOpenSession, useTeacherLessons } from '@/lib/api/attendance';
import { describeError } from '@/lib/api/errors';
import type { TeacherLesson } from '@/lib/api/types';
import { useNow } from '@/lib/clock';
import { addDays, formatDate, schoolClock, schoolDate } from '@/lib/schedule';

// The server keeps lesson days from 7 days back to 14 ahead.
const MIN_OFFSET = -7;
const MAX_OFFSET = 14;
const OPENS_BEFORE_MS = 15 * 60_000;

type Phase = 'open' | 'finished' | 'disabled' | 'upcoming' | 'startable' | 'missed';

function phaseOf(lesson: TeacherLesson, now: number): Phase {
  if (lesson.session) return lesson.session.status;
  if (!lesson.attendance_enabled) return 'disabled';
  const start = Date.parse(lesson.starts_at);
  if (now < start - OPENS_BEFORE_MS) return 'upcoming';
  if (now <= Date.parse(lesson.ends_at)) return 'startable';
  return 'missed';
}

function relativeDay(offset: number, date: string): string {
  if (offset === 0) return 'Today';
  if (offset === -1) return 'Yesterday';
  if (offset === 1) return 'Tomorrow';
  return formatDate(date);
}

// The teacher's home: their lessons on a day, each with its attendance.
export function TeacherToday() {
  const insets = useSafeAreaInsets();
  const now = useNow();
  const [offset, setOffset] = useState(0);
  const date = addDays(schoolDate(now), offset);
  const lessons = useTeacherLessons(date, offset === 0);
  const open = useOpenSession();

  function start(lesson: TeacherLesson) {
    open.mutate(
      { group_id: lesson.group_id, date },
      {
        onSuccess: (s) => router.push({ pathname: '/attendance/[id]', params: { id: s.id } }),
        onError: (e) => {
          haptics.error();
          Alert.alert('Couldn’t start attendance', describeError(e));
        },
      },
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-brand"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 32 }}
      contentContainerClassName="gap-4 px-5"
      refreshControl={
        <RefreshControl
          refreshing={lessons.isRefetching}
          onRefresh={() => lessons.refetch()}
          tintColor={colors.accent}
          colors={[colors.accent]}
          progressBackgroundColor={colors.surface}
        />
      }>
      <View className="gap-1">
        <Text variant="largeTitle" className="text-white" accessibilityRole="header">
          {relativeDay(offset, date)}
        </Text>
        <View className="flex-row items-center justify-between">
          <Text variant="subhead" style={{ color: colors.secondaryText }}>
            {formatDate(date)}
          </Text>
          <View className="flex-row items-center gap-1">
            <DayButton label="‹" hint="Previous day" disabled={offset <= MIN_OFFSET} onPress={() => setOffset(offset - 1)} />
            {offset !== 0 && <DayButton label="Today" hint="Back to today" onPress={() => setOffset(0)} />}
            <DayButton label="›" hint="Next day" disabled={offset >= MAX_OFFSET} onPress={() => setOffset(offset + 1)} />
          </View>
        </View>
      </View>

      {lessons.isPending ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 48 }} />
      ) : lessons.isError ? (
        <Notice tone="error" title="Couldn’t load your lessons" message={describeError(lessons.error)} />
      ) : lessons.data.lessons.length === 0 ? (
        <View className="items-center gap-2 px-4 py-16">
          <Text variant="title3" className="text-white">
            No lessons
          </Text>
          <Text variant="subhead" style={{ color: colors.secondaryText, textAlign: 'center' }}>
            Nothing on your HolliHop schedule for this day.
          </Text>
        </View>
      ) : (
        lessons.data.lessons.map((lesson) => (
          <LessonCard
            key={lesson.group_id}
            lesson={lesson}
            phase={phaseOf(lesson, now)}
            starting={open.isPending && open.variables?.group_id === lesson.group_id}
            onStart={() => start(lesson)}
          />
        ))
      )}
    </ScrollView>
  );
}

function DayButton({ label, hint, disabled, onPress }: { label: string; hint: string; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={hint}
      style={({ pressed }) => ({
        minWidth: 40,
        height: 34,
        paddingHorizontal: 12,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? 'rgba(255,255,255,0.12)' : colors.surface,
        opacity: disabled ? 0.35 : 1,
      })}>
      <Text variant="headline" style={{ color: colors.accent }}>
        {label}
      </Text>
    </Pressable>
  );
}

const CHIP: Partial<Record<Phase, { label: string; color: string }>> = {
  open: { label: 'In progress', color: colors.accent },
  finished: { label: 'Done', color: colors.success },
  missed: { label: 'Not taken', color: colors.tertiaryText },
};

function LessonCard({
  lesson,
  phase,
  starting,
  onStart,
}: {
  lesson: TeacherLesson;
  phase: Phase;
  starting: boolean;
  onStart: () => void;
}) {
  const chip = CHIP[phase];
  const details = [lesson.discipline, lesson.classroom && `Room ${lesson.classroom}`, `${lesson.students} ${lesson.students === 1 ? 'student' : 'students'}`]
    .filter(Boolean)
    .join(' · ');
  const openSession = () =>
    lesson.session && router.push({ pathname: '/attendance/[id]', params: { id: lesson.session.id } });

  const body = (
    <View className="gap-3">
      <View className="flex-row items-center justify-between gap-3">
        <Text variant="title3" className="text-white" style={{ fontVariant: ['tabular-nums'] }}>
          {lesson.begin_time}–{lesson.end_time}
        </Text>
        {chip && <StateChip label={chip.label} color={chip.color} />}
      </View>
      <View className="gap-0.5">
        <Text variant="headline" className="text-white">
          {lesson.group_name}
        </Text>
        <Text variant="footnote" style={{ color: colors.secondaryText }}>
          {details}
        </Text>
      </View>
      {phase === 'startable' && <Button label="Start attendance" onPress={onStart} loading={starting} />}
      {phase === 'open' && <Button label="Continue attendance" onPress={openSession} />}
      {phase === 'upcoming' && (
        <Text variant="footnote" style={{ color: colors.tertiaryText }}>
          Attendance opens at {schoolClock(Date.parse(lesson.starts_at) - OPENS_BEFORE_MS)}.
        </Text>
      )}
      {phase === 'missed' && (
        <Text variant="footnote" style={{ color: colors.tertiaryText }}>
          Attendance wasn’t taken in the app. The office can still mark it in HolliHop.
        </Text>
      )}
      {phase === 'disabled' && (
        <Text variant="footnote" style={{ color: colors.tertiaryText }}>
          One-to-one and online lessons don’t take attendance in the app.
        </Text>
      )}
    </View>
  );

  // A finished lesson is one tap from its results and corrections.
  if (phase === 'finished') {
    return (
      <PressableScale
        onPress={openSession}
        pressedScale={0.98}
        className="rounded-3xl bg-surface p-5"
        accessibilityRole="button"
        accessibilityHint="Shows the marks; you can correct them for 24 hours">
        {body}
      </PressableScale>
    );
  }
  return <View className="rounded-3xl bg-surface p-5">{body}</View>;
}
