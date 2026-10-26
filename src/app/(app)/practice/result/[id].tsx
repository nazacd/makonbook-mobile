import { router, Stack, useLocalSearchParams } from 'expo-router';
import { CircleAlert, CloudCheck, CloudUpload, FileQuestion, type LucideIcon } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { QuestionNavigatorGrid } from '@/components/QuestionNavigatorGrid';
import { EmptyState, Skeleton } from '@/components/States';
import { Text } from '@/components/Text';
import { useColors, type Palette } from '@/design/colors';
import { fonts } from '@/design/typography';
import { isCorrect, slotKey } from '@/lib/practice/grade';
import { useLocalAttempts, usePackage, useServerAttempts, useUploadAttempts } from '@/lib/practice/hooks';
import { stagesOf, SUBJECT_LABEL, testName } from '@/lib/practice/run';
import type { Subject } from '@/lib/practice/types';

// An attempt's result: the estimated score, then each module's questions
// right, wrong or blank, each opening its review. A full test splits into its
// two sections; one section on its own is the score itself.
export default function PracticeResultScreen() {
  const colors = useColors();
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
      <View className="flex-1 gap-4 bg-brand px-5 pt-4">
        <Skeleton width={180} height={64} />
        <Skeleton width="70%" height={20} />
        <Skeleton height={44} />
      </View>
    );
  }
  if (!shown) {
    return (
      <View className="flex-1 bg-brand px-5">
        <EmptyState icon={FileQuestion} title="Not on this phone" message="This result isn’t on this phone." />
      </View>
    );
  }

  const sections = shown.sections as Subject[];
  const full = shown.total != null;
  const only = sections[0]!;
  const answers = new Map((attempt?.answers ?? []).map((a) => [slotKey(a.subject, a.module, a.position), a.answer]));
  const sent: { icon: LucideIcon; tone: keyof Palette; text: string } | null = !attempt
    ? null
    : attempt.rejected
      ? { icon: CircleAlert, tone: 'bad', text: `Not sent to your teachers: ${attempt.rejected}` }
      : attempt.uploaded
        ? { icon: CloudCheck, tone: 'good', text: 'Sent to your teachers' }
        : { icon: CloudUpload, tone: 'ink3', text: 'Sends to your teachers when you’re online' };
  const score = full ? shown.total : shown.scores[only]?.score;

  return (
    <ScrollView className="flex-1 bg-brand" contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 48, gap: 28 }}>
      <Stack.Screen options={{ title: testName(shown.title) }} />

      <View className="gap-3">
        <View
          className="flex-row items-baseline gap-2.5"
          accessible
          accessibilityLabel={`Estimated ${full ? 'SAT' : SUBJECT_LABEL[only]} score ${score ?? 'unknown'} of ${full ? 1600 : 800}`}>
          <Text style={{ fontFamily: fonts.displayBold, fontSize: 64, lineHeight: 70, color: colors.ink, fontVariant: ['tabular-nums'] }} maxFontSizeMultiplier={1.2}>
            {score ?? '–'}
          </Text>
          <Text variant="callout" style={{ color: colors.ink3 }}>
            of {full ? 1600 : 800}
          </Text>
        </View>
        {full ? (
          <View className="flex-row">
            {sections.map((s, i) => {
              const sc = shown.scores[s];
              return (
                <View key={s} className="flex-1 gap-1.5" style={i ? { borderLeftWidth: 1, borderLeftColor: colors.line, paddingLeft: 18 } : undefined}>
                  <Text variant="subhead" style={{ color: colors.ink2 }}>
                    {SUBJECT_LABEL[s]}
                  </Text>
                  <Text style={{ fontFamily: fonts.displayBold, fontSize: 30, lineHeight: 34, color: colors.ink, fontVariant: ['tabular-nums'] }} maxFontSizeMultiplier={1.2}>
                    {sc?.score ?? '–'}
                  </Text>
                  {sc && (
                    <Text variant="footnote" style={{ color: colors.ink3, fontVariant: ['tabular-nums'] }}>
                      {sc.raw} of {sc.questions} right
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View className="flex-row items-baseline gap-2">
            <Text variant="title3" style={{ color: colors.ink }}>
              {SUBJECT_LABEL[only]}
            </Text>
            {shown.scores[only] && (
              <Text variant="subhead" style={{ color: colors.ink3, fontVariant: ['tabular-nums'] }}>
                {shown.scores[only]!.raw} of {shown.scores[only]!.questions} right
              </Text>
            )}
          </View>
        )}
      </View>

      {sent && (
        <View className="flex-row items-center gap-2">
          <Icon as={sent.icon} size={17} color={colors[sent.tone]} />
          <Text variant="subhead" className="flex-1" style={{ color: colors.ink2 }}>
            {sent.text}
          </Text>
        </View>
      )}

      {pkg.data && attempt ? (
        stagesOf(pkg.data, sections).map((stage) => {
          const items = stage.module.questions.map((q) => {
            const given = answers.get(slotKey(stage.subject, stage.module.module, q.position));
            return { id: q.position, outcome: !given ? ('skipped' as const) : isCorrect(q, given) ? ('correct' as const) : ('incorrect' as const) };
          });
          const right = items.filter((x) => x.outcome === 'correct').length;
          const wrong = items.filter((x) => x.outcome === 'incorrect').length;
          const blank = items.length - right - wrong;
          return (
            <View key={`${stage.subject}-${stage.module.module}`} className="gap-3">
              <View className="gap-0.5">
                <Text variant="title3" style={{ color: colors.ink, fontSize: 18, lineHeight: 23 }}>
                  {SUBJECT_LABEL[stage.subject]} · Module {stage.module.module}
                </Text>
                <Text variant="subhead" style={{ fontVariant: ['tabular-nums'] }}>
                  <Text variant="subhead" style={{ color: colors.good, fontWeight: '500' }}>
                    {right} right
                  </Text>
                  {wrong > 0 && (
                    <>
                      <Text variant="subhead" style={{ color: colors.ink3 }}>
                        {' · '}
                      </Text>
                      <Text variant="subhead" style={{ color: colors.bad, fontWeight: '500' }}>
                        {wrong} wrong
                      </Text>
                    </>
                  )}
                  {blank > 0 && (
                    <Text variant="subhead" style={{ color: colors.ink3 }}>
                      {' · '}
                      {blank} blank
                    </Text>
                  )}
                </Text>
              </View>
              <QuestionNavigatorGrid
                variant="results"
                items={items}
                onPress={(position) =>
                  router.push({
                    pathname: '/practice/review/[id]/[slot]',
                    params: { id, slot: slotKey(stage.subject, stage.module.module, position) },
                  })
                }
              />
            </View>
          );
        })
      ) : (
        <Text variant="subhead" style={{ color: colors.ink2 }}>
          Download this test again to go through the questions.
        </Text>
      )}

      <Text variant="caption" style={{ color: colors.ink3, fontWeight: '400' }}>
        Scores are an estimate from College Board’s practice tests; the real SAT adapts to you.
      </Text>
    </ScrollView>
  );
}
