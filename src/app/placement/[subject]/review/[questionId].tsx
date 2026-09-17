import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNavBar } from '@/components/BottomNavBar';
import { QuestionCard } from '@/components/QuestionCard';
import { useSession } from '@/lib/session-context';
import type { PlacementSubject } from '@/lib/types';

export default function QuestionReviewScreen() {
  const { subject, questionId } = useLocalSearchParams<{ subject: PlacementSubject; questionId: string }>();
  const { state } = useSession();
  const [showExplanation, setShowExplanation] = useState(false);

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
    setShowExplanation(false);
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
                <Text className="text-sm font-semibold text-emerald-400">
                  Correct answer: {String(question.correct)}
                </Text>
                <Text
                  className={`text-sm font-medium ${
                    outcome === 'correct' ? 'text-emerald-400' : outcome === 'incorrect' ? 'text-red-400' : 'text-white/50'
                  }`}>
                  {outcome === 'correct' ? 'Correct' : outcome === 'incorrect' ? 'Incorrect' : 'Skipped'}
                </Text>
              </View>

              <Pressable
                onPress={() => setShowExplanation((value) => !value)}
                className="items-center rounded-xl border border-white/10 py-3">
                <Text className="text-base font-medium text-white">
                  {showExplanation ? 'Hide Explanation' : 'Show Explanation'}
                </Text>
              </Pressable>

              {showExplanation ? (
                <View className="rounded-xl bg-surface p-4">
                  <Text className="text-base text-white">{question.explanation}</Text>
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
