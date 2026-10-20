import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { Notice } from '@/components/Notice';
import { QuestionNavigatorGrid } from '@/components/QuestionNavigatorGrid';
import { Text } from '@/components/Text';
import { colors } from '@/design/colors';
import { isCorrect, slotKey } from '@/lib/practice/grade';
import { useLocalAttempts, usePackage, useServerAttempts, useUploadAttempts } from '@/lib/practice/hooks';
import { stagesOf, SUBJECT_LABEL } from '@/lib/practice/run';
import type { Subject } from '@/lib/practice/types';

// An attempt's result: the estimated scores, then every question right, wrong
// or blank, each opening its review.
export default function PracticeResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const local = useLocalAttempts();
  useUploadAttempts(true);
  const attempt = local.data?.find((a) => a.id === id);
  const server = useServerAttempts(!attempt && !local.isPending);
  const fromServer = server.data?.find((a) => a.id === id);
  const shown = attempt ?? fromServer;
  const pkg = usePackage(attempt?.code ?? '', attempt?.version);

  if (local.isPending || (!attempt && server.isPending)) {
    return (
      <View className="flex-1 items-center justify-center bg-brand">
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  if (!shown) {
    return (
      <View className="flex-1 justify-center bg-brand px-6">
        <Notice tone="error" message="This result isn’t on this phone." />
      </View>
    );
  }

  const sections = shown.sections as Subject[];
  const answers = new Map((attempt?.answers ?? []).map((a) => [slotKey(a.subject, a.module, a.position), a.answer]));

  return (
    <ScrollView
      className="flex-1 bg-brand"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-6 px-5 pb-12 pt-4">
      <Stack.Screen options={{ title: shown.title }} />

      <View className="items-center gap-1 rounded-3xl px-5 py-6" style={{ backgroundColor: 'rgba(139, 92, 246, 0.16)' }}>
        <Text variant="caption" style={{ color: colors.accent, textTransform: 'uppercase' }}>
          {shown.total != null ? 'Estimated SAT score' : `Estimated ${SUBJECT_LABEL[sections[0]!]} score`}
        </Text>
        <Text variant="largeTitle" className="text-white" style={{ fontSize: 56, lineHeight: 64, fontVariant: ['tabular-nums'] }}>
          {shown.total ?? shown.scores[sections[0]!]?.score ?? '—'}
        </Text>
        <Text variant="footnote" style={{ color: colors.secondaryText }}>
          {new Date(shown.finished_at).toLocaleString()}
        </Text>
      </View>

      <View className="flex-row gap-3">
        {sections.map((s) => {
          const sc = shown.scores[s];
          return (
            <View key={s} className="flex-1 gap-1 rounded-3xl bg-surface p-4">
              <Text variant="footnote" style={{ color: colors.secondaryText }}>
                {SUBJECT_LABEL[s]}
              </Text>
              <Text variant="title2" className="text-white" style={{ fontVariant: ['tabular-nums'] }}>
                {sc?.score ?? '—'}
              </Text>
              <Text variant="footnote" style={{ color: colors.tertiaryText }}>
                {sc ? `${sc.raw} of ${sc.questions} right` : ''}
              </Text>
            </View>
          );
        })}
      </View>

      {attempt && (
        <Text variant="footnote" style={{ color: colors.tertiaryText }}>
          {attempt.rejected
            ? `Not sent to your teachers: ${attempt.rejected}`
            : attempt.uploaded
              ? 'Sent to your teachers.'
              : 'Will be sent to your teachers when you’re online.'}{' '}
          Scores are an estimate from College Board’s practice tests; the real SAT adapts to you.
        </Text>
      )}

      {pkg.data && attempt ? (
        stagesOf(pkg.data, sections).map((stage) => (
          <View key={`${stage.subject}-${stage.module.module}`} className="gap-3">
            <Text variant="headline" className="text-white">
              {SUBJECT_LABEL[stage.subject]} · Module {stage.module.module}
            </Text>
            <QuestionNavigatorGrid
              variant="results"
              items={stage.module.questions.map((q) => {
                const given = answers.get(slotKey(stage.subject, stage.module.module, q.position));
                return { id: q.position, outcome: !given ? 'skipped' : isCorrect(q, given) ? 'correct' : 'incorrect' };
              })}
              onPress={(position) =>
                router.push({
                  pathname: '/practice/review/[id]/[slot]',
                  params: { id, slot: slotKey(stage.subject, stage.module.module, position) },
                })
              }
            />
          </View>
        ))
      ) : (
        <Text variant="subhead" style={{ color: colors.secondaryText }}>
          Download this test again to go through the questions.
        </Text>
      )}
    </ScrollView>
  );
}
