import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, X } from 'lucide-react-native';

import { BottomNavBar } from '@/components/BottomNavBar';
import { Icon } from '@/components/Icon';
import { Notice } from '@/components/Notice';
import { RichContent } from '@/components/practice/RichContent';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import { isCorrect, slotKey } from '@/lib/practice/grade';
import { useLocalAttempts, usePackage } from '@/lib/practice/hooks';
import { stagesOf, SUBJECT_LABEL } from '@/lib/practice/run';

// One question of a finished attempt: the student's answer, the right one,
// and why.
export default function PracticeReviewScreen() {
  const colors = useColors();
  const { id, slot } = useLocalSearchParams<{ id: string; slot: string }>();
  const insets = useSafeAreaInsets();
  const attempt = useLocalAttempts().data?.find((a) => a.id === id);
  const pkg = usePackage(attempt?.code ?? '', attempt?.version);
  if (!attempt || !pkg.data) {
    return (
      <View className="flex-1 justify-center bg-brand px-6">
        <Notice tone="error" message="This question isn’t on this phone any more." />
      </View>
    );
  }

  // Every question of the attempt in order, to step through them.
  const all = stagesOf(pkg.data, attempt.sections).flatMap((stage) =>
    stage.module.questions.map((q) => ({ stage, q, key: slotKey(stage.subject, stage.module.module, q.position) })),
  );
  const at = all.findIndex((x) => x.key === slot);
  const item = all[at];
  if (!item) return null;
  const { stage, q } = item;
  const given = attempt.answers.find((a) => slotKey(a.subject, a.module, a.position) === slot)?.answer ?? null;
  const right = isCorrect(q, given);
  const key = q.type === 'mcq' ? q.correct : (q.accepted ?? []).join(', ');
  const open = (i: number) => router.setParams({ slot: all[i]!.key });

  return (
    <View className="flex-1 bg-brand">
      <Stack.Screen options={{ title: `Question ${q.position}` }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerClassName="gap-4 px-5 pb-8 pt-4" key={slot}>
        <Text variant="footnote" style={{ color: colors.ink3 }}>
          {SUBJECT_LABEL[stage.subject]} · Module {stage.module.module} · {q.skill}
          {q.difficulty ? ` · ${q.difficulty[0]!.toUpperCase()}${q.difficulty.slice(1)}` : ''}
        </Text>
        {/* The verdict in one line: when right, just the answer. */}
        <View className="flex-row flex-wrap items-center" style={{ columnGap: 18, rowGap: 6 }}>
          {right ? (
            <Verdict icon={Check} color={colors.good} text={`Correct · ${key}`} />
          ) : (
            <>
              {given ? <Verdict icon={X} color={colors.bad} text={`Your answer ${given}`} /> : <Verdict color={colors.ink3} text="Blank" />}
              <Verdict icon={Check} color={colors.good} text={`Correct ${key}`} />
            </>
          )}
        </View>

        {q.passage ? (
          <View className="bg-surface p-4" style={{ borderRadius: 14 }}>
            <RichContent text={q.passage} images={pkg.data.images} />
          </View>
        ) : null}
        <RichContent text={q.stem} images={pkg.data.images} fontSize={17} />
        {q.choices &&
          (['A', 'B', 'C', 'D'] as const)
            .filter((l) => q.choices![l] != null)
            .map((l) => {
              const correct = l === q.correct;
              const chosen = l === given;
              return (
                <View
                  key={l}
                  className="flex-row items-center gap-3 border p-3"
                  accessible
                  accessibilityLabel={`Choice ${l}${correct ? ', correct' : chosen ? ', your answer, wrong' : ''}`}
                  style={{
                    minHeight: 52,
                    borderRadius: 14,
                    borderColor: correct ? colors.good : chosen ? colors.bad : colors.line,
                    backgroundColor: correct ? colors.goodTint : chosen ? colors.badTint : colors.surface,
                  }}>
                  <View
                    className="items-center justify-center rounded-full"
                    style={{
                      width: 30,
                      height: 30,
                      borderWidth: 1,
                      borderColor: correct ? colors.good : chosen ? colors.bad : colors.lineStrong,
                      backgroundColor: correct ? colors.good : chosen ? colors.bad : 'transparent',
                    }}>
                    <Text variant="subhead" style={{ fontWeight: '600', color: correct || chosen ? colors.bg : colors.ink }}>
                      {l}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <RichContent text={q.choices![l]} images={pkg.data!.images} displayMath />
                  </View>
                  {correct ? <Icon as={Check} size={20} strokeWidth={2.25} color={colors.good} /> : chosen ? <Icon as={X} size={20} strokeWidth={2.25} color={colors.bad} /> : null}
                </View>
              );
            })}

        <View className="gap-1" style={{ marginTop: 8 }}>
          <Text variant="title3" style={{ color: colors.ink, fontSize: 18, lineHeight: 23 }} accessibilityRole="header">
            Why
          </Text>
          <RichContent text={q.explanation} images={pkg.data.images} fontSize={16} color={colors.ink} />
        </View>
      </ScrollView>
      <View style={{ paddingBottom: insets.bottom }} className="bg-brand">
        <BottomNavBar
          onBack={at > 0 ? () => open(at - 1) : undefined}
          backDisabled={at === 0}
          onNext={at < all.length - 1 ? () => open(at + 1) : () => router.back()}
          nextLabel={at < all.length - 1 ? 'Next' : 'Done'}
          centerSlot={
            <Text className="text-sm font-medium text-ink">
              {at + 1} of {all.length}
            </Text>
          }
        />
      </View>
    </View>
  );
}

function Verdict({ icon, color, text }: { icon?: typeof Check; color: string; text: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      {icon && <Icon as={icon} size={18} strokeWidth={2.25} color={color} />}
      <Text variant="callout" style={{ color, fontWeight: '500' }}>
        {text}
      </Text>
    </View>
  );
}
