import { Stack, useLocalSearchParams } from 'expo-router';
import { Users } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { ScoreChange } from '@/components/practice/ScoreChange';
import { EmptyState, ErrorState, Skeleton } from '@/components/States';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import { fonts } from '@/design/typography';
import { describeError } from '@/lib/api/errors';
import { useMe } from '@/lib/api/queries';
import { useNow } from '@/lib/clock';
import { normalCase } from '@/lib/groups';
import { useGroupPractice } from '@/lib/practice/hooks';
import { SUBJECT_LABEL, SUBJECT_SHORT, testName } from '@/lib/practice/run';
import { practicedSince, useLastVisit } from '@/lib/practice/summary';
import type { GroupStudent, ServerAttempt } from '@/lib/practice/types';
import { lastClass, pastDay, relativeDay } from '@/lib/schedule';

const isFull = (a: ServerAttempt) => a.total != null;

/** What a student's row shows: their latest full test (with the change since the one before), else their latest section. */
function standing(s: GroupStudent) {
  const fulls = s.attempts.filter(isFull); // newest first
  const latest = s.attempts[0];
  if (fulls[0]) return { latest, full: fulls[0].total!, change: fulls[1] ? fulls[0].total! - fulls[1].total! : 0, section: null };
  const subject = latest?.sections[0];
  return { latest, full: null, change: 0, section: latest && subject ? `${SUBJECT_SHORT[subject]} ${latest.scores[subject]?.score}` : null };
}

// A group's practice: how many practised since the last lesson, then every
// student by their latest result. Full-test scores (out of 1600) and section
// scores (out of 800) never share the column: a student with only sections
// shows "Math 620" in smaller type.
export default function GroupPracticeScreen() {
  const colors = useColors();
  const { id, name, student } = useLocalSearchParams<{ id: string; name?: string; student?: string }>();
  const query = useGroupPractice(id);
  // Opened from a new result: that student's attempts start open.
  const [open, setOpen] = useState<number | null>(student ? Number(student) : null);
  const [pulling, setPulling] = useState(false);
  const students = query.data ?? [];
  const now = useNow();
  const visit = useLastVisit();
  const group = useMe().data?.groups.find((g) => String(g.id) === id);
  // Practised since the group's last lesson (none in the past week: no figure).
  const lesson = group ? lastClass(group, now) : null;
  const tried = students
    .filter((s) => s.attempts.length > 0)
    .sort((a, b) => b.attempts[0]!.finished_at.localeCompare(a.attempts[0]!.finished_at));
  const untried = students.filter((s) => s.attempts.length === 0);

  return (
    <ScrollView
      className="flex-1 bg-brand"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 48 }}
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
      <Stack.Screen options={{ title: name ?? 'Practice' }} />
      {query.isPending ? (
        <View className="gap-4">
          <Skeleton width={140} height={44} />
          {[0, 1, 2, 3].map((i) => (
            <View key={i} className="flex-row items-center gap-3">
              <Skeleton width={36} height={36} radius={18} />
              <View className="flex-1">
                <Skeleton height={18} />
              </View>
            </View>
          ))}
        </View>
      ) : query.isError ? (
        <ErrorState title="Couldn’t load the results" message={describeError(query.error)} onRetry={() => query.refetch()} retrying={query.isFetching} />
      ) : students.length === 0 ? (
        <EmptyState icon={Users} title="No students yet" message="Students show up here once the office adds them to this group." />
      ) : (
        <>
          {lesson && (
            <View
              className="flex-row items-baseline gap-3"
              style={{ marginBottom: 16 }}
              accessible
              accessibilityLabel={`${practicedSince(students, lesson.end)} of ${students.length} practiced since ${pastDay(lesson.end, now, true)}’s lesson`}>
              <Text style={{ fontFamily: fonts.displayBold, fontSize: 44, lineHeight: 50, color: colors.ink, fontVariant: ['tabular-nums'] }} maxFontSizeMultiplier={1.2}>
                {practicedSince(students, lesson.end)}
                <Text style={{ fontFamily: fonts.displaySemiBold, fontSize: 24, color: colors.ink3 }}> / {students.length}</Text>
              </Text>
              <Text variant="subhead" className="flex-1" style={{ color: colors.ink2 }}>
                practiced since {pastDay(lesson.end, now, true)}’s lesson
              </Text>
            </View>
          )}
          {tried.map((s, i) => (
            <StudentRow
              key={s.client_id}
              student={s}
              now={now}
              fresh={visit != null && Date.parse(s.attempts[0]!.finished_at) > visit}
              first={i === 0}
              open={open === s.client_id}
              onToggle={() => setOpen(open === s.client_id ? null : s.client_id)}
            />
          ))}
          {untried.length > 0 && (
            <View style={{ marginTop: tried.length ? 24 : 0 }}>
              <Text variant="subhead" style={{ color: colors.ink3, marginBottom: 2 }}>
                No tests yet
              </Text>
              {untried.map((s, i) => (
                <View
                  key={s.client_id}
                  className="flex-row items-center gap-3"
                  style={{ minHeight: 56, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}>
                  <View style={{ opacity: 0.7 }}>
                    <Avatar kind="student" firstName={s.first_name} lastName={s.last_name} id={s.client_id} size={36} />
                  </View>
                  <Text variant="body" style={{ color: colors.ink2 }}>
                    {normalCase(`${s.first_name} ${s.last_name}`)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function StudentRow({
  student: s,
  now,
  fresh,
  first,
  open,
  onToggle,
}: {
  student: GroupStudent;
  now: number;
  fresh: boolean;
  first: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const colors = useColors();
  const name = normalCase(`${s.first_name} ${s.last_name}`);
  const { latest, full, change, section } = standing(s);
  const latestLine = latest
    ? `${testName(latest.title)} · ${relativeDay(Date.parse(latest.finished_at), now)}`
    : '';

  return (
    <View style={{ borderTopWidth: first ? 0 : 1, borderTopColor: colors.line }}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${name}${fresh ? ', new' : ''}, ${latestLine}, ${full != null ? `${full}${change ? `, ${change > 0 ? 'up' : 'down'} ${Math.abs(change)}` : ''}` : section}`}
        style={({ pressed }) => ({ marginHorizontal: -20, paddingHorizontal: 20, backgroundColor: pressed ? colors.surface2 : 'transparent' })}>
        <View className="flex-row items-center gap-3" style={{ minHeight: 64, paddingVertical: 8 }}>
          <Avatar kind="student" firstName={s.first_name} lastName={s.last_name} id={s.client_id} size={36} />
          <View className="flex-1 gap-0.5">
            <View className="flex-row items-center gap-2">
              <Text variant="body" numberOfLines={1} style={{ color: colors.ink, flexShrink: 1 }}>
                {name}
              </Text>
              {fresh && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} />}
            </View>
            <Text variant="footnote" numberOfLines={1} style={{ color: colors.ink3 }}>
              {latestLine}
            </Text>
          </View>
          {full != null ? (
            <View className="flex-row items-baseline gap-2">
              <ScoreChange change={change} />
              <Text style={{ fontFamily: fonts.displayBold, fontSize: 22, lineHeight: 28, color: colors.ink, fontVariant: ['tabular-nums'] }} maxFontSizeMultiplier={1.2}>
                {full}
              </Text>
            </View>
          ) : (
            <Text variant="subhead" style={{ color: colors.ink2, fontVariant: ['tabular-nums'] }}>
              {section}
            </Text>
          )}
        </View>
      </Pressable>
      {open && <History attempts={s.attempts} now={now} />}
    </View>
  );
}

// Every attempt, hanging from the avatar on a thin rail like the student's
// path: a filled node for a full test, a ring for one section.
function History({ attempts, now }: { attempts: ServerAttempt[]; now: number }) {
  const colors = useColors();
  return (
    <View style={{ marginLeft: 17, paddingLeft: 31, marginTop: -4, marginBottom: 8 }}>
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 26, width: 2, backgroundColor: colors.lineStrong }} />
      {attempts.map((a) => {
        const full = isFull(a);
        const subject = a.sections[0]!;
        const when = relativeDay(Date.parse(a.finished_at), now);
        const detail = full
          ? `${when} · ${a.sections.map((x) => `${SUBJECT_SHORT[x]} ${a.scores[x]?.score}`).join(' · ')}`
          : `${when} · ${a.scores[subject]?.raw} of ${a.scores[subject]?.questions} right`;
        return (
          <View key={a.id} className="flex-row items-center gap-3" style={{ minHeight: 52 }} accessible accessibilityLabel={`${testName(a.title)}, ${full ? 'full test' : SUBJECT_LABEL[subject]}, ${detail}, ${full ? a.total : `${SUBJECT_SHORT[subject]} ${a.scores[subject]?.score}`}`}>
            <View
              style={{
                position: 'absolute',
                left: -35,
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: full ? colors.primary : colors.bg,
                borderWidth: full ? 0 : 2,
                borderColor: colors.lineStrong,
              }}
            />
            <View className="flex-1">
              <Text variant="subhead" style={{ color: colors.ink }}>
                {testName(a.title)} · {full ? 'Full test' : SUBJECT_LABEL[subject]}
              </Text>
              <Text variant="caption" style={{ color: colors.ink3, fontWeight: '400', fontVariant: ['tabular-nums'] }}>
                {detail}
              </Text>
            </View>
            {full ? (
              <Text style={{ fontFamily: fonts.displayBold, fontSize: 18, color: colors.ink, fontVariant: ['tabular-nums'] }} maxFontSizeMultiplier={1.2}>
                {a.total}
              </Text>
            ) : (
              <Text variant="subhead" style={{ color: colors.ink2, fontVariant: ['tabular-nums'] }}>
                {a.scores[subject]?.score}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}
