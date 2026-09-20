import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNavBar } from '@/components/BottomNavBar';
import { MathText } from '@/components/MathText';
import { QuestionCard } from '@/components/QuestionCard';
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
              onPress={() => router.push({ pathname: '/placement/[subject]/results', params: { subject } })}
              hitSlop={8}>
              <Text className="text-base font-medium text-accent">← Results</Text>
            </Pressable>
          </View>

          <ScrollView className="flex-1">
            <View className="gap-4 p-4">
              <QuestionCard question={question} />

              <View className="gap-2 rounded-xl border border-white/10 bg-surface p-4">
                <Text className="text-sm font-semibold text-white">
                  Your answer: {chosen != null && chosen !== '' ? String(chosen) : '— (skipped)'}
                </Text>
                <Text
                  className={`text-sm font-medium ${
                    outcome === 'correct' ? 'text-emerald-400' : outcome === 'incorrect' ? 'text-red-400' : 'text-white/50'
                  }`}>
                  {outcome === 'correct' ? 'Correct' : outcome === 'incorrect' ? 'Incorrect' : 'Skipped'}
                </Text>
              </View>

              {question.options ? (
                <View className="gap-3">
                  {OPTION_LETTERS.map((letter) => {
                    const isChosen = chosen === letter;
                    const isCorrect = question.correct === letter;

                    let rowClass = 'border-white/10 bg-surface';
                    let badgeClass = 'border-white/20';
                    if (revealed && isCorrect) {
                      rowClass = 'border-emerald-400 bg-emerald-400/10';
                      badgeClass = 'border-emerald-400 bg-emerald-400';
                    } else if (revealed && isChosen) {
                      rowClass = 'border-red-400 bg-red-400/10';
                      badgeClass = 'border-red-400 bg-red-400';
                    } else if (isChosen) {
                      rowClass = 'border-accent bg-accent/10';
                      badgeClass = 'border-accent bg-accent';
                    }

                    return (
                      <View key={letter} className={`flex-row items-center gap-3 rounded-xl border p-3 ${rowClass}`}>
                        <View className={`h-8 w-8 items-center justify-center rounded-full border ${badgeClass}`}>
                          <MathText text={letter} className="font-semibold text-white" />
                        </View>
                        <View className="flex-1">
                          <MathText text={question.options![letter]} className="text-base text-white" />
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : null}

              <Pressable
                onPress={() => setRevealed((value) => !value)}
                className="items-center rounded-xl border border-white/10 py-3">
                <Text className="text-base font-medium text-white">{revealed ? 'Hide Answer' : 'Show Answer'}</Text>
              </Pressable>

              {revealed ? (
                <View className="gap-3">
                  {!question.options ? (
                    <View className="rounded-xl border border-emerald-400 bg-emerald-400/10 p-4">
                      <Text className="text-sm font-semibold text-emerald-400">
                        Correct answer: {String(question.correct)}
                      </Text>
                    </View>
                  ) : null}
                  <View className="rounded-xl bg-surface p-4">
                    <Text className="text-base text-white">{question.explanation}</Text>
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
