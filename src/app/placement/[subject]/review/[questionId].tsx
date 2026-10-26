import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNavBar } from '@/components/BottomNavBar';
import { MathText } from '@/components/MathText';
import { QuestionCard } from '@/components/QuestionCard';
import { Text } from '@/components/Text';
import { formatGridInAnswer } from '@/lib/gradeAnswer';
import { useSession } from '@/lib/session-context';
import type { OptionLetter, PlacementSubject } from '@/lib/types';

const OPTION_LETTERS: OptionLetter[] = ['A', 'B', 'C', 'D'];

export default function QuestionReviewScreen() {
  const { subject, questionId } = useLocalSearchParams<{ subject: PlacementSubject; questionId: string }>();
  const { state } = useSession();
  const [revealed, setRevealed] = useState(false);

  const id = Number(questionId);
  const index = state.questions.findIndex((q) => q.id === id);
  const question = state.questions[index];

  if (!question || !state.results) {
    return <View className="flex-1 bg-brand" />;
  }

  const chosen = state.answers[question.id];
  const outcome = state.results.perQuestion[question.id];
  const isFirst = index === 0;
  const isLast = index === state.questions.length - 1;

  const goToIndex = (nextIndex: number) => {
    const nextQuestion = state.questions[nextIndex];
    if (!nextQuestion) return;
    setRevealed(false);
    router.replace({
      pathname: '/placement/[subject]/review/[questionId]',
      params: { subject, questionId: String(nextQuestion.id) },
    });
  };

  return (
    <View className="flex-1 bg-brand">
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <View className="flex-1">
          <View className="flex-row items-center px-4 py-3">
            <Pressable
              onPress={() =>
                router.canGoBack()
                  ? router.back()
                  : router.replace({ pathname: '/placement/[subject]/results', params: { subject } })
              }
              hitSlop={8}>
              <Text className="text-base font-medium text-accent">← Results</Text>
            </Pressable>
          </View>

          <ScrollView className="flex-1">
            <View className="gap-4 p-4">
              <QuestionCard question={question} />

              <View className="gap-2 rounded-xl border border-line bg-surface p-4">
                <Text className="text-sm font-semibold text-ink">
                  Your answer: {chosen != null && chosen !== '' ? String(chosen) : '— (skipped)'}
                </Text>
                <Text
                  className={`text-sm font-medium ${
                    outcome === 'correct' ? 'text-good' : outcome === 'incorrect' ? 'text-bad' : 'text-ink-3'
                  }`}>
                  {outcome === 'correct' ? 'Correct' : outcome === 'incorrect' ? 'Incorrect' : 'Skipped'}
                </Text>
              </View>

              {question.options ? (
                <View className="gap-3">
                  {OPTION_LETTERS.map((letter) => {
                    const isChosen = chosen === letter;
                    const isCorrect = question.correct === letter;

                    let rowClass = 'border-line bg-surface';
                    let badgeClass = 'border-line-strong';
                    if (revealed && isCorrect) {
                      rowClass = 'border-good bg-good-tint';
                      badgeClass = 'border-good bg-good';
                    } else if (revealed && isChosen) {
                      rowClass = 'border-bad bg-bad-tint';
                      badgeClass = 'border-bad bg-bad';
                    } else if (isChosen) {
                      rowClass = 'border-accent bg-accent-tint';
                      badgeClass = 'border-accent bg-accent';
                    }

                    return (
                      <View key={letter} className={`flex-row items-center gap-3 rounded-xl border p-3 ${rowClass}`}>
                        <View className={`h-8 w-8 items-center justify-center rounded-full border ${badgeClass}`}>
                          <MathText text={letter} className="font-semibold text-ink" />
                        </View>
                        <View className="flex-1">
                          <MathText text={question.options![letter]} className="text-base text-ink" />
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : null}

              <Pressable
                onPress={() => setRevealed((value) => !value)}
                className="items-center rounded-xl border border-line py-3">
                <Text className="text-base font-medium text-ink">{revealed ? 'Hide Answer' : 'Show Answer'}</Text>
              </Pressable>

              {revealed ? (
                <View className="gap-3">
                  {!question.options ? (
                    <View className="rounded-xl border border-good bg-good-tint p-4">
                      <Text className="text-sm font-semibold text-good">
                        Correct answer: {formatGridInAnswer(Number(question.correct))}
                      </Text>
                    </View>
                  ) : null}
                  <View className="rounded-xl bg-surface p-4">
                    <MathText text={question.explanation} className="text-base text-ink" looseLineHeight />
                  </View>
                </View>
              ) : null}
            </View>
          </ScrollView>

          <BottomNavBar
            backLabel="Previous"
            nextLabel="Next"
            backDisabled={isFirst}
            nextDisabled={isLast}
            onBack={isFirst ? undefined : () => goToIndex(index - 1)}
            onNext={isLast ? undefined : () => goToIndex(index + 1)}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
