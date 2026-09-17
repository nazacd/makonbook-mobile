import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnswerChoice } from '@/components/AnswerChoice';
import { BottomNavBar } from '@/components/BottomNavBar';
import { GridInInput } from '@/components/GridInInput';
import { QuestionCard } from '@/components/QuestionCard';
import { QuestionNavigatorGrid } from '@/components/QuestionNavigatorGrid';
import { Timer } from '@/components/Timer';
import { useSession } from '@/lib/session-context';
import { useRemainingTime } from '@/lib/timer';
import type { OptionLetter, PlacementSubject } from '@/lib/types';

const OPTION_LETTERS: OptionLetter[] = ['A', 'B', 'C', 'D'];

export default function TestRunnerScreen() {
  const { subject } = useLocalSearchParams<{ subject: PlacementSubject }>();
  const { state, setAnswer, toggleMark, toggleEliminated, goto, submitTest } = useSession();
  const { remainingMs, isExpired } = useRemainingTime(state.startTimestamp);

  const [showNavigator, setShowNavigator] = useState(false);
  const [showReviewGrid, setShowReviewGrid] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const total = state.questions.length;
  const question = state.questions[state.currentIndex];
  const isFirst = state.currentIndex === 0;
  const isLast = state.currentIndex === total - 1;

  useEffect(() => {
    if (state.status === 'not-started') {
      router.replace({ pathname: '/placement/[subject]/instructions', params: { subject } });
    } else if (state.status === 'submitted') {
      router.replace({ pathname: '/placement/[subject]/results', params: { subject } });
    }
  }, [state.status, subject]);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    await submitTest();
    router.replace({ pathname: '/placement/[subject]/results', params: { subject } });
  };

  useEffect(() => {
    if (isExpired && state.status === 'in-progress') {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpired, state.status]);

  if (state.status !== 'in-progress' || !question) {
    return <View className="flex-1 bg-white dark:bg-black" />;
  }

  const answerValue = state.answers[question.id];
  const marked = state.marked.includes(question.id);
  const eliminatedLetters = state.eliminated[question.id] ?? [];

  const answeredCount = state.questions.filter((q) => state.answers[q.id] != null && state.answers[q.id] !== '').length;
  const markedCount = state.marked.length;

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        <Timer remainingMs={remainingMs} />

        <ScrollView className="flex-1">
          <View className="gap-4 p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                Question {state.currentIndex + 1} of {total}
              </Text>
              <Pressable onPress={() => toggleMark(question.id)} hitSlop={8}>
                <Text className={`text-sm font-medium ${marked ? 'text-amber-600' : 'text-neutral-500 dark:text-neutral-400'}`}>
                  {marked ? '★ Marked for review' : 'Mark for review'}
                </Text>
              </Pressable>
            </View>

            <QuestionCard question={question} />

            {question.options ? (
              <View className="gap-3">
                {OPTION_LETTERS.map((letter) => (
                  <AnswerChoice
                    key={letter}
                    letter={letter}
                    text={question.options![letter]}
                    selected={answerValue === letter}
                    eliminated={eliminatedLetters.includes(letter)}
                    onSelect={() => setAnswer(question.id, letter)}
                    onToggleEliminate={() => toggleEliminated(question.id, letter)}
                  />
                ))}
              </View>
            ) : (
              <GridInInput
                value={answerValue == null ? '' : String(answerValue)}
                onChange={(value) => setAnswer(question.id, value)}
              />
            )}
          </View>
        </ScrollView>

        <BottomNavBar
          onBack={isFirst ? undefined : () => goto(state.currentIndex - 1)}
          backDisabled={isFirst}
          onNext={isLast ? () => setShowReviewGrid(true) : () => goto(state.currentIndex + 1)}
          nextLabel={isLast ? 'Review & Submit' : 'Next'}
          centerSlot={
            <Pressable onPress={() => setShowNavigator(true)}>
              <Text className="text-sm font-medium text-black dark:text-white">
                Question {state.currentIndex + 1} of {total}
              </Text>
            </Pressable>
          }
        />
      </SafeAreaView>

      <Modal visible={showNavigator} animationType="slide" onRequestClose={() => setShowNavigator(false)}>
        <View className="flex-1 bg-white dark:bg-black">
          <SafeAreaView className="flex-1 gap-4 p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-black dark:text-white">Questions</Text>
              <Pressable onPress={() => setShowNavigator(false)} hitSlop={8}>
                <Text className="text-base font-medium text-brand">Close</Text>
              </Pressable>
            </View>
            <ScrollView>
              <QuestionNavigatorGrid
                variant="progress"
                items={state.questions.map((q, index) => ({
                  id: q.id,
                  current: index === state.currentIndex,
                  answered: state.answers[q.id] != null && state.answers[q.id] !== '',
                  marked: state.marked.includes(q.id),
                }))}
                onPress={(id) => {
                  const index = state.questions.findIndex((q) => q.id === id);
                  if (index >= 0) goto(index);
                  setShowNavigator(false);
                }}
              />
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      <Modal visible={showReviewGrid} animationType="slide" onRequestClose={() => setShowReviewGrid(false)}>
        <View className="flex-1 bg-white dark:bg-black">
          <SafeAreaView className="flex-1 gap-4 p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-black dark:text-white">Review before submitting</Text>
              <Pressable onPress={() => setShowReviewGrid(false)} hitSlop={8}>
                <Text className="text-base font-medium text-brand">Close</Text>
              </Pressable>
            </View>
            <View className="flex-row gap-4">
              <Text className="text-sm text-neutral-600 dark:text-neutral-400">Answered: {answeredCount}</Text>
              <Text className="text-sm text-neutral-600 dark:text-neutral-400">Unanswered: {total - answeredCount}</Text>
              <Text className="text-sm text-neutral-600 dark:text-neutral-400">Marked: {markedCount}</Text>
            </View>
            <ScrollView className="flex-1">
              <QuestionNavigatorGrid
                variant="progress"
                items={state.questions.map((q, index) => ({
                  id: q.id,
                  current: index === state.currentIndex,
                  answered: state.answers[q.id] != null && state.answers[q.id] !== '',
                  marked: state.marked.includes(q.id),
                }))}
                onPress={(id) => {
                  const index = state.questions.findIndex((q) => q.id === id);
                  if (index >= 0) goto(index);
                  setShowReviewGrid(false);
                }}
              />
            </ScrollView>
            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              className={`items-center rounded-xl bg-brand py-4 ${submitting ? 'opacity-50' : ''}`}>
              <Text className="text-lg font-semibold text-white">{submitting ? 'Submitting…' : 'Submit Test'}</Text>
            </Pressable>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}
