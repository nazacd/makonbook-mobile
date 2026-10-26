import { router } from 'expo-router';
import { Inbox } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { ScoreChange } from '@/components/practice/ScoreChange';
import { EmptyState } from '@/components/States';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import { fonts } from '@/design/typography';
import { useMe } from '@/lib/api/queries';
import type { Profile } from '@/lib/api/types';
import { useNow } from '@/lib/clock';
import { normalCase, parseClassName, teacherTitle } from '@/lib/groups';
import { SUBJECT_SHORT } from '@/lib/practice/run';
import { useLastVisit, usePracticeSummary, type FreshResult } from '@/lib/practice/summary';
import { formatDate, schoolClock, schoolDate } from '@/lib/schedule';

// The results that came in since the teacher last left the Practice tab,
// newest first; each opens its group with the student's attempts open.
export default function NewResultsScreen() {
  const profile = useMe().data as Profile;
  const now = useNow();
  const since = useLastVisit();
  const summary = usePracticeSummary(profile.groups, since, now);
  const titles = new Map(profile.groups.map((g) => [g.id, teacherTitle(parseClassName(g.name, g.discipline))]));

  return (
    <ScrollView className="flex-1 bg-brand" contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 }}>
      {summary.fresh.length === 0 ? (
        <EmptyState icon={Inbox} title="Nothing new" message="New practice results from your groups show up here." />
      ) : (
        summary.fresh.map((r, i) => (
          <ResultRow key={r.attempt.id} result={r} group={titles.get(r.groupId) ?? ''} now={now} first={i === 0} />
        ))
      )}
    </ScrollView>
  );
}

function ResultRow({ result, group, now, first }: { result: FreshResult; group: string; now: number; first: boolean }) {
  const colors = useColors();
  const { student, attempt, previousTotal } = result;
  const name = normalCase(`${student.first_name} ${student.last_name}`);
  const at = Date.parse(attempt.finished_at);
  const when = schoolDate(at) === schoolDate(now) ? schoolClock(at) : formatDate(schoolDate(at));
  const section = attempt.total == null ? attempt.sections[0] : null;
  const score = section ? attempt.scores[section]?.score : attempt.total;
  const change = attempt.total != null && previousTotal != null ? attempt.total - previousTotal : 0;
  const what = section ? `${attempt.title}, ${SUBJECT_SHORT[section]}` : attempt.title;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/practice/group/[id]',
          params: { id: String(result.groupId), name: group, student: String(student.client_id) },
        })
      }
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${group}, ${what}, ${section ? `${SUBJECT_SHORT[section]} ${score}` : score}${change ? `, ${change > 0 ? 'up' : 'down'} ${Math.abs(change)}` : ''}, ${when}`}
      style={({ pressed }) => ({ marginHorizontal: -20, paddingHorizontal: 20, backgroundColor: pressed ? colors.surface2 : 'transparent' })}>
      <View className="flex-row items-center gap-3" style={{ minHeight: 68, paddingVertical: 10, borderTopWidth: first ? 0 : 1, borderTopColor: colors.line }}>
        <Avatar kind="student" firstName={student.first_name} lastName={student.last_name} id={student.client_id} size={36} />
        <View className="flex-1 gap-0.5">
          <Text variant="body" numberOfLines={1} style={{ color: colors.ink }}>
            {name}
          </Text>
          <Text variant="footnote" numberOfLines={1} style={{ color: colors.ink3 }}>
            {group} · {what} · {when}
          </Text>
        </View>
        {section ? (
          <Text variant="subhead" style={{ color: colors.ink2, fontVariant: ['tabular-nums'] }}>
            {SUBJECT_SHORT[section]} {score}
          </Text>
        ) : (
          <View className="flex-row items-baseline gap-2">
            <ScoreChange change={change} />
            <Text style={{ fontFamily: fonts.displayBold, fontSize: 22, lineHeight: 28, color: colors.ink, fontVariant: ['tabular-nums'] }} maxFontSizeMultiplier={1.2}>
              {score}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
