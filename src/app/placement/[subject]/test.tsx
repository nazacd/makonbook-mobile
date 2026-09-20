import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnswerChoice } from '@/components/AnswerChoice';
import { BookmarkIcon } from '@/components/BookmarkIcon';
import { BottomNavBar } from '@/components/BottomNavBar';
import { CalculatorIcon } from '@/components/CalculatorIcon';
import { CalculatorWidget } from '@/components/CalculatorWidget';
import { GridInInput } from '@/components/GridInInput';
import { HomeIcon } from '@/components/HomeIcon';
import { QuestionCard } from '@/components/QuestionCard';
import { QuestionNavigatorGrid } from '@/components/QuestionNavigatorGrid';
import { Timer } from '@/components/Timer';
import { useSession } from '@/lib/session-context';
import { useRemainingTime } from '@/lib/timer';
import type { OptionLetter, PlacementSubject } from '@/lib/types';

const OPTION_LETTERS: OptionLetter[] = ['A', 'B', 'C', 'D'];

export default function TestRunnerScreen() {
  const { subject } = useLocalSearchParams<{ subject: PlacementSubject }>();
  const { state, setAnswer, toggleMark, toggleEliminated, goto, submitTest, shiftStart } = useSession();
  const { remainingMs, isExpired } = useRemainingTime(state.startTimestamp);

  const [showNavigator, setShowNavigator] = useState(false);
  const [showReviewGrid, setShowReviewGrid] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const pausedAtRef = useRef<number | null>(null);

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

  // Pause the countdown while this screen is not the focused route (e.g. the
  // student navigated back to Home) by shifting startTimestamp forward on
  // return; OS-level backgrounding does not blur/refocus the route, so it's
  // unaffected and keeps counting down per the proctored-session spec.
  useFocusEffect(
    useCallback(() => {
      if (pausedAtRef.current != null) {
        shiftStart(Date.now() - pausedAtRef.current);
        pausedAtRef.current = null;
      }
      return () => {
        if (state.status === 'in-progress') {
          pausedAtRef.current = Date.now();
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.status])
  );

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

  const handleExit = () => {
    Alert.alert('Leave test?', 'Your progress is saved and the timer will pause until you return.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => router.push('/') },
    ]);
  };

  if (state.status !== 'in-progress' || !question) {
    return <View className="flex-1 bg-brand" />;
  }

  const answerValue = state.answers[question.id];
  const marked = state.marked.includes(question.id);
  const eliminatedLetters = state.eliminated[question.id] ?? [];

  const answeredCount = state.questions.filter((q) => state.answers[q.id] != null && state.answers[q.id] !== '').length;
  const markedCount = state.marked.length;

  return (
    <View className="flex-1 bg-brand">
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <View className="flex-1">
          <View className="flex-row items-center border-b border-white/10 bg-brand px-2">
            <Pressable onPress={handleExit} hitSlop={10} className="p-2">
              <HomeIcon size={20} />
            </Pressable>
            <View className="flex-1">
              <Timer remainingMs={remainingMs} />
            </View>
            {subject === 'math' ? (
              <Pressable onPress={() => setShowCalculator((prev) => !prev)} hitSlop={10} className="p-2">
                <CalculatorIcon size={20} />
              </Pressable>
            ) : null}
            <Pressable onPress={() => toggleMark(question.id)} hitSlop={10} className="p-2">
              <BookmarkIcon size={20} color={marked ? '#fbbf24' : '#ffffff'} filled={marked} />
            </Pressable>
          </View>

          <ScrollView className="flex-1">
            <View className="gap-4 p-4">
              <Text className="text-sm text-white/50">
                Question {state.currentIndex + 1} of {total}
              </Text>

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
                <Text className="text-sm font-medium text-white">
                  Question {state.currentIndex + 1} of {total}
                </Text>
              </Pressable>
            }
          />
        </View>
      </SafeAreaView>

      <Modal visible={showNavigator} animationType="slide" onRequestClose={() => setShowNavigator(false)}>
        <View className="flex-1 bg-brand">
          <SafeAreaView style={{ flex: 1 }}>
            <View className="flex-1 gap-4 p-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-semibold text-white">Questions</Text>
                <Pressable onPress={() => setShowNavigator(false)} hitSlop={8}>
                  <Text className="text-base font-medium text-accent">Close</Text>
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
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      <Modal visible={showReviewGrid} animationType="slide" onRequestClose={() => setShowReviewGrid(false)}>
        <View className="flex-1 bg-brand">
          <SafeAreaView style={{ flex: 1 }}>
            <View className="flex-1 gap-4 p-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-semibold text-white">Review before submitting</Text>
                <Pressable onPress={() => setShowReviewGrid(false)} hitSlop={8}>
                  <Text className="text-base font-medium text-accent">Close</Text>
                </Pressable>
              </View>
              <View className="flex-row gap-4">
                <Text className="text-sm text-white/60">Answered: {answeredCount}</Text>
                <Text className="text-sm text-white/60">Unanswered: {total - answeredCount}</Text>
                <Text className="text-sm text-white/60">Marked: {markedCount}</Text>
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
                className={`items-center rounded-xl bg-accent py-4 ${submitting ? 'opacity-50' : ''}`}>
                <Text className="text-lg font-semibold text-white">{submitting ? 'Submitting…' : 'Submit Test'}</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      <CalculatorWidget visible={showCalculator} onClose={() => setShowCalculator(false)} />
    </View>
  );
}
