import { useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bookmark, Calculator, House } from 'lucide-react-native';

import { AnswerChoice } from '@/components/AnswerChoice';
import { BottomNavBar } from '@/components/BottomNavBar';
import { Button } from '@/components/Button';
import { CalculatorWidget } from '@/components/CalculatorWidget';
import { GridInInput } from '@/components/GridInInput';
import { Icon } from '@/components/Icon';
import { Notice } from '@/components/Notice';
import { RichContent } from '@/components/practice/RichContent';
import { QuestionNavigatorGrid } from '@/components/QuestionNavigatorGrid';
import { FixedTextScale, Text } from '@/components/Text';
import { Timer } from '@/components/Timer';
import { useColors } from '@/design/colors';
import { usePackage, usePerson, useRefreshLocal, useRun, useRunStore } from '@/lib/practice/hooks';
import { saveAttempt, type Run } from '@/lib/practice/local';
import { finishRun, questionKey, stagesOf, SUBJECT_LABEL } from '@/lib/practice/run';
import { confirm } from '@/lib/confirm';
import { useRemainingTime } from '@/lib/timer';

const LETTERS = ['A', 'B', 'C', 'D'] as const;

/** How often time used is saved while a module is on screen. */
const PERSIST_INTERVAL_MS = 5000;

// Taking a practice test: its modules one after another, each with its own
// time, as in Bluebook. A module's answers are final once it is submitted (or
// its time runs out). Leaving pauses the time; everything is saved on the
// phone, so the test can be resumed later, offline.
export default function PracticeRunScreen() {
  const colors = useColors();
  const { code } = useLocalSearchParams<{ code: string }>();
  const stored = useRun(code);
  const pkg = usePackage(code, stored.data?.version);

  if (stored.isPending || (stored.data && pkg.isPending)) {
    return (
      <View className="flex-1 items-center justify-center bg-brand">
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  if (!stored.data || !pkg.data) {
    return (
      <View className="flex-1 justify-center gap-4 bg-brand px-6">
        <Notice tone="error" title="This test isn’t on your phone" message="Download it again from the test’s page." />
        <Button label="Close" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }
  // Laid out for fixed sizes, like the paper test: ignores the phone's font size.
  return (
    <FixedTextScale>
      <Runner initial={stored.data} pkg={pkg.data} />
    </FixedTextScale>
  );
}

function Runner({ initial, pkg }: { initial: Run; pkg: NonNullable<ReturnType<typeof usePackage>['data']> }) {
  const colors = useColors();
  const person = usePerson();
  const runs = useRunStore();
  const refresh = useRefreshLocal();
  const queryClient = useQueryClient();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const [run, setRun] = useState(initial);
  // When the current module's clock started, as if it had run without a
  // break: now − time used. Null while the module waits to be started.
  const [startTs, setStartTs] = useState<number | null>(null);
  const [showNavigator, setShowNavigator] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const stages = stagesOf(pkg, run.sections);
  const stage = stages[run.stage]!;
  const questions = stage.module.questions;
  const question = questions[run.index]!;
  const qKey = questionKey(stage, question);
  const minutes = stage.module.minutes;
  const { remainingMs, isExpired } = useRemainingTime(startTs, isFocused && run.ready, minutes * 60_000);

  // Time on each question: counted from when it was shown until another one
  // is, or the module ends, or the screen is left.
  const shownAt = useRef<number | null>(null);
  const latest = useRef({ run, startTs, qKey });
  useLayoutEffect(() => {
    latest.current = { run, startTs, qKey };
  });

  // The run as it is now, with time used and time on the current question
  // counted up to this moment.
  const snapshot = useCallback((): Run => {
    const { run: r, startTs: s, qKey: k } = latest.current;
    const now = Date.now();
    const seconds = { ...r.seconds };
    if (r.ready && shownAt.current != null) {
      seconds[k] = (seconds[k] ?? 0) + (now - shownAt.current) / 1000;
      shownAt.current = now;
    }
    return { ...r, seconds, elapsedMs: r.ready && s != null ? now - s : r.elapsedMs };
  }, []);

  // Set once the last module is submitted: from then on the run is an
  // attempt, and nothing (leaving the screen, the periodic save) may write the
  // run back.
  const finished = useRef(false);

  const persist = useCallback(() => {
    if (finished.current) return;
    const r = snapshot();
    latest.current.run = r;
    setRun(r);
    runs.save(r);
  }, [runs, snapshot]);

  // Answers, marks and moves are saved as they happen.
  const update = (change: (r: Run) => Run) => {
    if (finished.current) return;
    const r = change(snapshot());
    latest.current.run = r;
    setRun(r);
    runs.save(r);
  };

  // The clock runs only while this screen is in front: leaving (or closing
  // the app) saves the time used, coming back carries on from it.
  useFocusEffect(
    useCallback(() => {
      const r = latest.current.run;
      if (r.ready) {
        setStartTs(Date.now() - r.elapsedMs);
        shownAt.current = Date.now();
      }
      return () => {
        persist();
        shownAt.current = null;
      };
    }, [persist]),
  );

  useEffect(() => {
    if (!isFocused || !run.ready) return;
    const id = setInterval(persist, PERSIST_INTERVAL_MS);
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') persist();
      else if (latest.current.run.ready) {
        // Back from the background: the clock didn't run meanwhile.
        setStartTs(Date.now() - latest.current.run.elapsedMs);
        shownAt.current = Date.now();
      }
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [isFocused, run.ready, persist]);

  const startModule = () => {
    shownAt.current = Date.now();
    setStartTs(Date.now());
    update((r) => ({ ...r, ready: true, elapsedMs: 0, index: 0 }));
  };

  const goto = (index: number) => update((r) => ({ ...r, index: Math.max(0, Math.min(questions.length - 1, index)) }));

  const submitting = useRef(false);
  const submitModule = async () => {
    if (submitting.current) return;
    submitting.current = true;
    setShowReview(false);
    setShowNavigator(false);
    setShowCalculator(false);
    const r = snapshot();
    shownAt.current = null;
    setStartTs(null);
    if (r.stage + 1 < stages.length) {
      const next = { ...r, stage: r.stage + 1, ready: false, elapsedMs: 0, index: 0 };
      latest.current.run = next;
      setRun(next);
      await runs.save(next);
      submitting.current = false;
      return;
    }
    finished.current = true;
    setFinishing(true);
    const attempt = finishRun(pkg, r, new Date());
    await saveAttempt(person, attempt);
    await runs.clear(r.code);
    refresh();
    queryClient.invalidateQueries({ queryKey: ['practice-upload'] });
    router.replace({ pathname: '/practice/result/[id]', params: { id: attempt.id } });
  };

  // Time's up: the module is submitted as it is.
  useEffect(() => {
    if (!isFocused || !run.ready || !isExpired) return;
    const id = setTimeout(submitModule, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused, run.ready, isExpired]);

  const leave = () =>
    confirm({
      title: 'Leave the test?',
      message: 'Your answers are saved and the clock stops until you come back.',
      confirm: 'Leave',
      cancel: 'Stay',
      destructive: true,
      onConfirm: () => router.back(),
    });

  const moduleLabel = `${SUBJECT_LABEL[stage.subject]} · Module ${stage.module.module}`;

  if (finishing) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-brand">
        <ActivityIndicator color={colors.accent} />
        <Text variant="subhead" style={{ color: colors.ink2 }}>
          Scoring your test…
        </Text>
      </View>
    );
  }

  if (!run.ready) {
    const newSection = run.stage > 0 && stages[run.stage - 1]!.subject !== stage.subject;
    return (
      <View className="flex-1 bg-brand">
        <SafeAreaView style={{ flex: 1 }}>
          <View className="flex-1 justify-between px-6 py-4">
            <Pressable onPress={() => router.back()} hitSlop={10} className="self-start p-2" accessibilityRole="button" accessibilityLabel="Close">
              <Icon as={House} size={20} />
            </Pressable>
            <View className="gap-3">
              <Text variant="caption" style={{ color: colors.accent, textTransform: 'uppercase' }}>
                {pkg.title} · Part {run.stage + 1} of {stages.length}
              </Text>
              <Text variant="title" className="text-ink">
                {moduleLabel}
              </Text>
              <Text variant="body" style={{ color: colors.ink2 }}>
                {questions.length} questions · {minutes} minutes
                {stage.subject === 'math' ? ' · calculator allowed' : ''}
              </Text>
              {newSection ? (
                <Text variant="subhead" style={{ color: colors.ink2 }}>
                  On the real SAT you get a 10-minute break here. Take one if you like: the clock starts only when you
                  tap Start.
                </Text>
              ) : run.stage > 0 ? (
                <Text variant="subhead" style={{ color: colors.ink2 }}>
                  The previous module is submitted. Its answers can’t be changed now.
                </Text>
              ) : null}
            </View>
            <Button label={`Start module ${stage.module.module}`} onPress={startModule} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const answer = run.answers[qKey];
  const marked = run.marked.includes(qKey);
  const eliminated = run.eliminated[qKey] ?? [];
  const keyOf = (i: number) => questionKey(stage, questions[i]!);
  const grid = questions.map((q, i) => ({
    id: i + 1,
    current: i === run.index,
    answered: !!run.answers[keyOf(i)]?.trim(),
    marked: run.marked.includes(keyOf(i)),
  }));
  const answered = grid.filter((g) => g.answered).length;
  const isLast = run.index === questions.length - 1;

  return (
    <View className="flex-1 bg-brand">
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <View className="flex-1">
          <View className="flex-row items-center border-b border-line bg-brand px-2">
            <Pressable onPress={leave} hitSlop={10} className="p-2" accessibilityRole="button" accessibilityLabel="Leave the test">
              <Icon as={House} size={20} />
            </Pressable>
            <View className="flex-1">
              <Timer remainingMs={remainingMs} />
            </View>
            {stage.subject === 'math' ? (
              <Pressable
                onPress={() => setShowCalculator((v) => !v)}
                hitSlop={10}
                className="p-2"
                accessibilityLabel="Calculator">
                <Icon as={Calculator} size={20} />
              </Pressable>
            ) : null}
            <Pressable
              onPress={() =>
                update((r) => ({
                  ...r,
                  marked: r.marked.includes(qKey) ? r.marked.filter((k) => k !== qKey) : [...r.marked, qKey],
                }))
              }
              hitSlop={10}
              className="p-2"
              accessibilityLabel={marked ? 'Unmark for review' : 'Mark for review'}>
              <Icon as={Bookmark} size={20} color={marked ? colors.fillWatch : colors.ink} fill={marked ? colors.fillWatch : 'none'} />
            </Pressable>
          </View>

          <ScrollView className="flex-1" key={qKey}>
            <View className="gap-4 p-4">
              <Text variant="footnote" style={{ color: colors.ink2 }}>
                {moduleLabel} · Question {run.index + 1} of {questions.length}
              </Text>
              {question.passage ? (
                <View className="rounded-xl bg-surface p-4">
                  <RichContent text={question.passage} images={pkg.images} />
                </View>
              ) : null}
              <RichContent text={question.stem} images={pkg.images} fontSize={17} />
              {question.type === 'mcq' && question.choices ? (
                <View className="gap-3">
                  {LETTERS.filter((l) => question.choices![l] != null).map((letter) => (
                    <AnswerChoice
                      key={letter}
                      letter={letter}
                      text={question.choices![letter]!}
                      content={<RichContent text={question.choices![letter]} images={pkg.images} displayMath />}
                      selected={answer === letter}
                      eliminated={eliminated.includes(letter)}
                      onSelect={() => update((r) => ({ ...r, answers: { ...r.answers, [qKey]: letter } }))}
                      onToggleEliminate={() =>
                        update((r) => {
                          const cur = r.eliminated[qKey] ?? [];
                          const striking = !cur.includes(letter);
                          const answers = { ...r.answers };
                          // A struck-out choice can't stay the answer.
                          if (striking && answers[qKey] === letter) delete answers[qKey];
                          return {
                            ...r,
                            answers,
                            eliminated: {
                              ...r.eliminated,
                              [qKey]: striking ? [...cur, letter] : cur.filter((x) => x !== letter),
                            },
                          };
                        })
                      }
                    />
                  ))}
                </View>
              ) : (
                <GridInInput
                  value={answer ?? ''}
                  onChange={(value) => update((r) => ({ ...r, answers: { ...r.answers, [qKey]: value } }))}
                />
              )}
            </View>
          </ScrollView>

          <View style={{ paddingBottom: insets.bottom }} className="bg-brand">
            <BottomNavBar
              onBack={run.index === 0 ? undefined : () => goto(run.index - 1)}
              backDisabled={run.index === 0}
              onNext={isLast ? () => setShowReview(true) : () => goto(run.index + 1)}
              nextLabel={isLast ? 'Review' : 'Next'}
              centerSlot={
                <Pressable onPress={() => setShowNavigator(true)} accessibilityLabel="All questions">
                  <Text className="text-sm font-medium text-ink">
                    {run.index + 1} of {questions.length} ▾
                  </Text>
                </Pressable>
              }
            />
          </View>
        </View>
      </SafeAreaView>

      <Modal
        visible={showNavigator || showReview}
        animationType="slide"
        onRequestClose={() => {
          setShowNavigator(false);
          setShowReview(false);
        }}>
        <View className="flex-1 bg-brand">
          <SafeAreaView style={{ flex: 1 }}>
            <View className="flex-1 gap-4 p-4">
              <View className="flex-row items-center justify-between">
                <Text variant="headline" className="text-ink">
                  {showReview ? 'Check your work' : moduleLabel}
                </Text>
                <Pressable
                  onPress={() => {
                    setShowNavigator(false);
                    setShowReview(false);
                  }}
                  hitSlop={8}>
                  <Text className="text-base font-medium text-accent">Close</Text>
                </Pressable>
              </View>
              <View className="flex-row gap-4">
                <Text variant="footnote" style={{ color: colors.ink2 }}>
                  Answered: {answered}
                </Text>
                <Text variant="footnote" style={{ color: colors.ink2 }}>
                  Blank: {questions.length - answered}
                </Text>
                <Text variant="footnote" style={{ color: colors.ink2 }}>
                  For review: {grid.filter((g) => g.marked).length}
                </Text>
              </View>
              <ScrollView className="flex-1">
                <QuestionNavigatorGrid
                  variant="progress"
                  items={grid}
                  onPress={(id) => {
                    goto(id - 1);
                    setShowNavigator(false);
                    setShowReview(false);
                  }}
                />
              </ScrollView>
              <Button
                label={run.stage + 1 < stages.length ? `Submit module ${stage.module.module}` : 'Submit the test'}
                accessibilityHint="Answers in this module can't be changed afterwards"
                onPress={() =>
                  confirm({
                    title: 'Submit this module?',
                    message:
                      questions.length - answered === 1
                        ? 'One question is blank. You can’t come back to this module.'
                        : questions.length - answered > 1
                          ? `${questions.length - answered} questions are blank. You can’t come back to this module.`
                          : 'You can’t come back to this module.',
                    confirm: 'Submit',
                    cancel: 'Keep working',
                    onConfirm: submitModule,
                  })
                }
              />
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      <CalculatorWidget visible={showCalculator} onClose={() => setShowCalculator(false)} />
    </View>
  );
}
