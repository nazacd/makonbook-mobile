import * as Crypto from 'expo-crypto';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Notice } from '@/components/Notice';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import * as haptics from '@/design/haptics';
import { describeError } from '@/lib/api/errors';
import { confirm } from '@/lib/confirm';
import {
  useCatalog,
  useDownloads,
  useDownloadTest,
  useLocalAttempts,
  usePackage,
  useRemoveDownload,
  useRuns,
  useRunStore,
} from '@/lib/practice/hooks';
import { formatBytes, newRun, SUBJECT_LABEL } from '@/lib/practice/run';
import type { Subject } from '@/lib/practice/types';

type Choice = 'full' | Subject;

const CHOICES: { value: Choice; label: string; sections: Subject[] }[] = [
  { value: 'full', label: 'Full test', sections: ['english', 'math'] },
  { value: 'english', label: 'Reading and Writing', sections: ['english'] },
  { value: 'math', label: 'Math', sections: ['math'] },
];

// One test: download it, choose what to take, start or continue; past results.
export default function PracticeTestScreen() {
  const colors = useColors();
  const { code } = useLocalSearchParams<{ code: string }>();
  const runStore = useRunStore();
  const catalog = useCatalog();
  const downloads = useDownloads();
  const runs = useRuns();
  const attempts = useLocalAttempts();
  const download = useDownloadTest();
  const remove = useRemoveDownload();
  const [choice, setChoice] = useState<Choice>('full');

  const test = catalog.data?.find((t) => t.code === code);
  const local = downloads.data?.[code];
  const pkg = usePackage(code, local?.version);
  const run = runs.data?.[code];
  const mine = (attempts.data ?? []).filter((a) => a.code === code);
  const title = test?.title ?? local?.title ?? code;
  const update = !!(local && test?.version && test.version > local.version);

  const start = async () => {
    if (!pkg.data) return;
    const sections = CHOICES.find((c) => c.value === choice)!.sections;
    await runStore.save(newRun(pkg.data, sections, Crypto.randomUUID(), new Date()));
    router.push({ pathname: '/practice/run/[code]', params: { code } });
  };

  const discard = () =>
    confirm({
      title: 'Discard your progress?',
      message: 'The answers you gave in this attempt are deleted.',
      confirm: 'Discard',
      cancel: 'Keep',
      destructive: true,
      onConfirm: async () => {
        await runStore.clear(code);
      },
    });

  const startDownload = () =>
    download.mutate(code, {
      onSuccess: () => haptics.success(),
      // The reason shows above the button.
      onError: () => haptics.error(),
    });

  const sizes = pkg.data?.sections.map((s) => ({
    subject: s.subject,
    questions: s.modules.reduce((n, m) => n + m.questions.length, 0),
    minutes: s.modules.reduce((n, m) => n + m.minutes, 0),
  }));

  return (
    <ScrollView
      className="flex-1 bg-brand"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-6 px-5 pb-12 pt-4">
      <Stack.Screen options={{ title }} />

      <View className="gap-1">
        <Text variant="title" className="text-ink">
          {title}
        </Text>
        <Text variant="subhead" style={{ color: colors.ink2 }}>
          {sizes
            ? sizes.map((s) => `${SUBJECT_LABEL[s.subject]}: ${s.questions} questions, ${s.minutes} min`).join('\n')
            : test
              ? `Reading and Writing: ${test.english} questions · Math: ${test.math} questions`
              : ''}
        </Text>
      </View>

      {!local || update ? (
        <View className="gap-3">
          <Text variant="subhead" style={{ color: colors.ink2 }}>
            {update
              ? 'Teachers corrected some questions since you downloaded this test. Update to get them; your results stay.'
              : 'Download the test once and take it any time, even without internet.'}
          </Text>
          {download.isError && <Notice tone="error" message={describeError(download.error)} />}
          <Button
            label={
              download.isPending
                ? download.progress?.total
                  ? `Downloading images ${download.progress.done} of ${download.progress.total}…`
                  : 'Downloading…'
                : `${update ? 'Update' : 'Download'} · ${formatBytes(test?.bytes ?? 0)}`
            }
            loading={download.isPending && !download.progress?.total}
            disabled={download.isPending || !test?.version}
            onPress={startDownload}
          />
        </View>
      ) : null}

      {local && run ? (
        <View className="gap-3 rounded-3xl p-5" style={{ backgroundColor: colors.accentTint }}>
          <Text variant="headline" className="text-ink">
            In progress: {run.sections.map((s) => SUBJECT_LABEL[s]).join(' and ')}
          </Text>
          <Text variant="subhead" style={{ color: colors.ink2 }}>
            Part {run.stage + 1}. The clock is stopped until you continue.
          </Text>
          <Button
            label="Continue"
            onPress={() => router.push({ pathname: '/practice/run/[code]', params: { code } })}
          />
          <Button label="Discard and start over" variant="destructive" onPress={discard} />
        </View>
      ) : local && pkg.data ? (
        <View className="gap-3">
          <View className="overflow-hidden rounded-3xl bg-surface" accessibilityRole="radiogroup">
            {CHOICES.map((c, i) => {
              const selected = c.value === choice;
              const minutes = (sizes ?? [])
                .filter((s) => c.sections.includes(s.subject))
                .reduce((n, s) => n + s.minutes, 0);
              return (
                <Pressable
                  key={c.value}
                  onPress={() => setChoice(c.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  style={({ pressed }) => ({ backgroundColor: pressed ? colors.surface2 : 'transparent' })}>
                  <View className="ml-5" style={i ? { borderTopWidth: 1, borderTopColor: colors.line } : undefined}>
                    <View className="min-h-[52px] flex-row items-center gap-3 py-3 pr-5">
                      <Text variant="body" className="flex-1 text-ink">
                        {c.label}
                      </Text>
                      <Text variant="subhead" style={{ color: colors.ink2 }}>
                        {minutes} min
                      </Text>
                      <View
                        className="h-6 w-6 items-center justify-center rounded-full border-2"
                        style={{ borderColor: selected ? colors.accent : colors.ink3 }}>
                        {selected && <View className="h-3 w-3 rounded-full bg-accent" />}
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Button label="Start" onPress={start} />
        </View>
      ) : null}

      {mine.length > 0 && (
        <View className="gap-2">
          <Text variant="footnote" style={{ color: colors.ink2, textTransform: 'uppercase' }} className="px-1">
            Your results
          </Text>
          <View className="overflow-hidden rounded-3xl bg-surface">
            {mine.map((a, i) => (
              <Pressable
                key={a.id}
                onPress={() => router.push({ pathname: '/practice/result/[id]', params: { id: a.id } })}
                accessibilityRole="button"
                style={({ pressed }) => ({ backgroundColor: pressed ? colors.surface2 : 'transparent' })}>
                <View className="ml-5" style={i ? { borderTopWidth: 1, borderTopColor: colors.line } : undefined}>
                  <View className="min-h-[52px] flex-row items-center gap-3 py-3 pr-5">
                    <View className="flex-1">
                      <Text variant="body" className="text-ink">
                        {a.sections.map((s) => SUBJECT_LABEL[s]).join(' and ')}
                      </Text>
                      <Text variant="footnote" style={{ color: colors.ink3 }}>
                        {new Date(a.finished_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text variant="headline" style={{ color: colors.accent, fontVariant: ['tabular-nums'] }}>
                      {a.total ?? Object.values(a.scores)[0]?.score}
                    </Text>
                    <Icon as={ChevronRight} size={18} color={colors.ink3} />
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {local && !run && (
        <Button
          label="Remove from phone"
          variant="destructive"
          onPress={() =>
            confirm({
              title: 'Remove this test from your phone?',
              message: 'Your results stay. You can download it again any time.',
              confirm: 'Remove',
              destructive: true,
              onConfirm: () => remove.mutate(code),
            })
          }
        />
      )}
    </ScrollView>
  );
}
