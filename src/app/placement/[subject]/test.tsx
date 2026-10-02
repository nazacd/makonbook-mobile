import { router, useFocusEffect, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Alert, AppState, Modal, Pressable, ScrollView, View } from 'react-native';
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
import { Text } from '@/components/Text';
import { Timer } from '@/components/Timer';
import { useSession } from '@/lib/session-context';
import { useRemainingTime } from '@/lib/timer';
import type { OptionLetter, PlacementSubject } from '@/lib/types';

const OPTION_LETTERS: OptionLetter[] = ['A', 'B', 'C', 'D'];

/** How often elapsed time is saved while the test is on screen. */
const PERSIST_INTERVAL_MS = 5000;

export default function TestRunnerScreen() {
  const { subject } = useLocalSearchParams<{ subject: PlacementSubject }>();
  const { state, setAnswer, toggleMark, toggleEliminated, goto, submitTest, shiftStart, persistNow } = useSession();
  const isFocused = useIsFocused();
  const { remainingMs, isExpired } = useRemainingTime(state.startTimestamp, isFocused);

  const [showNavigator, setShowNavigator] = useState(false);
  const [showReviewGrid, setShowReviewGrid] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const pausedAtRef = useRef<number | null>(null);
  const submittingRef = useRef(false);
  const persistNowRef = useRef(persistNow);
  useLayoutEffect(() => {
    persistNowRef.current = persistNow;
  });

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
  //
  // This only covers same-instance blur/refocus (e.g. this exact screen gets
  // covered and uncovered). Leaving via Home and coming back in through
  // Instructions mounts a brand new screen/session instance instead, which
  // has no pausedAtRef to shift — that path is made pause-safe separately by
  // persisting elapsed (not absolute) time, flushed immediately below on
  // blur so no in-progress time is missed between periodic saves.
  useFocusEffect(
    useCallback(() => {
      if (pausedAtRef.current != null) {
        shiftStart(Date.now() - pausedAtRef.current);
        pausedAtRef.current = null;
      }
      return () => {
        if (state.status === 'in-progress') {
          pausedAtRef.current = Date.now();
          persistNowRef.current();
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.status])
  );

  // Save elapsed time every few seconds, and immediately when the app leaves
  // the foreground, so closing or killing the app stops the timer at (at most
  // a few seconds before) that moment — not at the last answer change.
  useEffect(() => {
    if (!isFocused || state.status !== 'in-progress') return;
    const id = setInterval(() => persistNowRef.current(), PERSIST_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (next) => {
      if (next !== 'active') persistNowRef.current();
    });
    return () => {
      clearInterval(id);
      subscription.remove();
    };
  }, [isFocused, state.status]);

  const submit = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    await submitTest();
    router.replace({ pathname: '/placement/[subject]/results', params: { subject } });
  };

  const handleSubmit = () => {
    setSubmitting(true);
    submit();
  };

  // Auto-submit when time runs out.
  useEffect(() => {
    if (isFocused && isExpired && state.status === 'in-progress') {
      submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused, isExpired, state.status]);

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
