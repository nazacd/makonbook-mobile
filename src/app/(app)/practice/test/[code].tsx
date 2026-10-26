import * as Crypto from 'expo-crypto';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Clock, Download, History, Play, RefreshCw, RotateCcw, Trash2 } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { MoreMenu, type MenuItem } from '@/components/MoreMenu';
import { Notice } from '@/components/Notice';
import { Text } from '@/components/Text';
import { ThrownObjects, type Thrown } from '@/components/ThrownObjects';
import { useColors } from '@/design/colors';
import * as haptics from '@/design/haptics';
import { fonts } from '@/design/typography';
import { describeError } from '@/lib/api/errors';
import { confirm } from '@/lib/confirm';
import { useCatalog, useDownloads, useDownloadTest, useLocalAttempts, usePackage, useRemoveDownload, useRuns, useRunStore } from '@/lib/practice/hooks';
import { formatBytes, newRun, SUBJECT_LABEL, testName } from '@/lib/practice/run';
import type { Subject } from '@/lib/practice/types';

// The Digital SAT's sections: two modules each, 32 min for Reading and Writing
// and 35 for Math. Shown until the test's package (with its own times) is on
// the phone, since the catalogue has no times.
const SAT_MINUTES: Record<Subject, number> = { english: 64, math: 70 };

/** "2 h 14 min", or "64 min" under an hour (or always, when `short`). */
function duration(minutes: number, short = false): string {
  if (short || minutes < 60) return `${minutes} min`;
  return minutes % 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes / 60} h`;
}

// One test: the full test leads, with its action in the footer; below, each
// section on its own. Downloading, updating, and continuing a test in
// progress take the footer's place.
export default function PracticeTestScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { code } = useLocalSearchParams<{ code: string }>();
  const runStore = useRunStore();
  const catalog = useCatalog();
  const downloads = useDownloads();
  const runs = useRuns();
  const attempts = useLocalAttempts();
  const download = useDownloadTest();
  const remove = useRemoveDownload();

  const test = catalog.data?.find((t) => t.code === code);
  const local = downloads.data?.[code];
  const pkg = usePackage(code, local?.version);
  const run = runs.data?.[code];
  const mine = (attempts.data ?? []).filter((a) => a.code === code); // newest first
  const lastFull = mine.find((a) => a.total != null);
  const title = testName(test?.title ?? local?.title ?? code);
  const update = !!(local && test?.version && test.version > local.version);
  const ready = !!(local && pkg.data);
  const minutes = (subject?: Subject) =>
    pkg.data
      ? pkg.data.sections.filter((s) => !subject || s.subject === subject).reduce((n, s) => n + s.modules.reduce((m, mod) => m + mod.minutes, 0), 0)
      : subject
        ? SAT_MINUTES[subject]
        : SAT_MINUTES.english + SAT_MINUTES.math;

  const begin = async (sections: Subject[]) => {
    if (!pkg.data) return;
    await runStore.save(newRun(pkg.data, sections, Crypto.randomUUID(), new Date()));
    router.push({ pathname: '/practice/run/[code]', params: { code } });
  };
  // One test in progress per test on the phone: starting another asks first.
  const start = (sections: Subject[]) =>
    run
      ? confirm({
          title: 'Discard your progress?',
          message: 'The answers you gave in this attempt are deleted.',
          confirm: 'Discard',
          cancel: 'Keep',
          destructive: true,
          onConfirm: () => void begin(sections),
        })
      : void begin(sections);
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

  const menu: MenuItem[] = run
    ? [{ label: 'Discard progress', icon: RotateCcw, destructive: true, onPress: discard }]
    : local
      ? [
          ...(update && ready ? [{ label: 'Start without updating', icon: Play, onPress: () => start(['english', 'math']) }] : []),
          {
            label: 'Remove from phone',
            icon: Trash2,
            destructive: true,
            onPress: () =>
              confirm({
                title: 'Remove this test from your phone?',
                message: 'Your results stay. You can download it again any time.',
                confirm: 'Remove',
                destructive: true,
                onConfirm: () => remove.mutate(code),
              }),
          },
        ]
      : [];

  const action = run
    ? { label: 'Continue', onPress: () => router.push({ pathname: '/practice/run/[code]', params: { code } }) }
    : !local || update
      ? {
          label: download.isPending
            ? download.progress?.total
              ? `Downloading images ${download.progress.done} of ${download.progress.total}…`
              : 'Downloading…'
            : `${update ? 'Update' : 'Download'} · ${formatBytes(test?.bytes ?? 0)}`,
          onPress: startDownload,
          loading: download.isPending && !download.progress?.total,
          disabled: download.isPending || !test?.version,
        }
      : { label: 'Start full test', onPress: () => start(['english', 'math']), disabled: !ready };

  return (
    <View className="flex-1 bg-brand">
      <Stack.Screen options={{ title: '', headerRight: () => <MoreMenu items={menu} /> }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}>
        <Text variant="largeTitle" style={{ color: colors.ink, fontSize: 44, lineHeight: 50 }} accessibilityRole="header" maxFontSizeMultiplier={1.2}>
          {title}
        </Text>
        {update && !run && (
          <View className="flex-row items-center gap-2" style={{ marginTop: 10 }}>
            <Icon as={RefreshCw} size={17} color={colors.watch} />
            <Text variant="subhead" style={{ color: colors.watch, fontWeight: '500' }}>
              Teachers corrected some questions
            </Text>
          </View>
        )}
        {run ? (
          <View className="flex-row items-center gap-3" style={{ marginTop: 18 }} accessible accessibilityLabel={`In progress: ${progressLine(run.sections, run.stage)}`}>
            <View style={{ width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentTint }}>
              <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: colors.accent }} />
            </View>
            <Text variant="title2" style={{ color: colors.accent, fontFamily: fonts.displaySemiBold, fontSize: 26, lineHeight: 32 }}>
              {progressLine(run.sections, run.stage)}
            </Text>
          </View>
        ) : (
          <>
            <View className="flex-row items-end gap-3" style={{ marginTop: 18 }}>
              <Text variant="title2" className="flex-1" style={{ color: colors.ink, fontFamily: fonts.displaySemiBold, fontSize: 26, lineHeight: 32 }}>
                Full test
              </Text>
              {lastFull && (
                <Pressable
                  onPress={() => router.push({ pathname: '/practice/result/[id]', params: { id: lastFull.id } })}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={`Last full test ${lastFull.total}, opens the result`}>
                  <Text variant="footnote" style={{ color: colors.ink3, position: 'absolute', right: 0, bottom: '100%' }}>
                    Last
                  </Text>
                  <Text style={{ fontFamily: fonts.displayBold, fontSize: 30, lineHeight: 34, color: colors.ink, fontVariant: ['tabular-nums'] }} maxFontSizeMultiplier={1.2}>
                    {lastFull.total}
                  </Text>
                </Pressable>
              )}
            </View>
            <View className="flex-row items-center gap-1.5" style={{ marginTop: 4 }}>
              <Icon as={Clock} size={16} color={colors.ink3} />
              <Text variant="callout" style={{ color: colors.ink2, fontVariant: ['tabular-nums'] }}>
                {duration(minutes())}
              </Text>
            </View>
          </>
        )}

        <Text variant="subhead" style={{ color: colors.ink2, marginTop: 36, marginBottom: 10 }}>
          Or one section
        </Text>
        <Halves ready={ready} minutes={minutes} onStart={(s) => start([s])} />

        {mine.length > 0 && (
          <Pressable
            onPress={() => router.push({ pathname: '/practice/history/[code]', params: { code } })}
            accessibilityRole="button"
            accessibilityLabel={`History, ${mine.length} ${mine.length === 1 ? 'attempt' : 'attempts'}`}
            style={({ pressed }) => ({ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, opacity: pressed ? 0.6 : 1 })}>
            <Icon as={History} size={17} color={colors.ink3} />
            <Text variant="subhead" style={{ color: colors.ink2, fontWeight: '500' }}>
              History
            </Text>
            <Text variant="subhead" style={{ color: colors.ink3 }}>
              · {mine.length}
            </Text>
          </Pressable>
        )}
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 12, borderTopWidth: 1, borderTopColor: colors.line, gap: 10 }}>
        {download.isError && <Notice tone="error" message={describeError(download.error)} />}
        {!local && !download.isPending && (
          <View className="flex-row items-center justify-center gap-2">
            <Icon as={Download} size={16} color={colors.ink3} />
            <Text variant="footnote" style={{ color: colors.ink2 }}>
              Download once, then take it offline.
            </Text>
          </View>
        )}
        <Button label={action.label} onPress={action.onPress} loading={'loading' in action ? action.loading : false} disabled={action.disabled} />
      </View>
    </View>
  );
}

/** "Math, Part 1" for one section, "Full test, Part 3" for both. */
function progressLine(sections: Subject[], stage: number): string {
  return `${sections.length > 1 ? 'Full test' : SUBJECT_LABEL[sections[0]!]}, Part ${stage + 1}`;
}

// Each half's own objects (Advanced sets, one colour), resting faintly in its
// bottom-right corner. They're thrown in each time the screen opens: Math
// from past the screen's edge, R&W out of its own half's right side.
// [shape, scale, right, bottom, opacity]
const RW_OBJECTS: [string, number, number, number, number][] = [
  ['section', 1.1, 4, 4, 0.3],
  ['schwa', 0.75, 52, 2, 0.18],
  ['ae', 0.65, 20, 50, 0.16],
];
const MATH_OBJECTS: [string, number, number, number, number][] = [
  ['pi', 1.15, -6, 6, 0.32],
  ['integral', 0.95, 46, 2, 0.18],
  ['theta', 0.65, 18, 52, 0.18],
];

function Halves({ ready, minutes, onStart }: { ready: boolean; minutes: (s?: Subject) => number; onStart: (s: Subject) => void }) {
  const colors = useColors();
  const toThrown = (list: typeof RW_OBJECTS, color: string): Thrown[] =>
    list.map(([shape, scale, right, bottom, opacity]) => ({ shape, color, scale, right, bottom, opacity }));
  const half = (subject: Subject, name: string, objects: Thrown[], rightSide: boolean) => (
    <Pressable
      key={subject}
      onPress={() => onStart(subject)}
      disabled={!ready}
      accessibilityRole="button"
      accessibilityLabel={`${SUBJECT_LABEL[subject]} only, ${minutes(subject)} minutes`}
      accessibilityState={{ disabled: !ready }}
      style={({ pressed }) => ({
        flex: 1,
        paddingTop: 18,
        paddingLeft: rightSide ? 16 : 0,
        paddingRight: rightSide ? 0 : 8,
        borderLeftWidth: rightSide ? 1 : 0,
        borderLeftColor: colors.line,
        backgroundColor: pressed ? colors.surface2 : 'transparent',
        opacity: ready ? 1 : 0.5,
        // R&W's objects come out of its own right side, so that side clips.
        overflow: rightSide ? 'visible' : 'hidden',
      })}>
      <View style={{ position: 'absolute', top: 0, bottom: 0, right: rightSide ? -20 : 0, width: 120 }}>
        <ThrownObjects items={objects} play={0} travel={(o) => (o.right ?? 0) + (rightSide ? 40 : 6)} delay={rightSide ? 0 : 140} />
      </View>
      <Text variant="title3" numberOfLines={1} style={{ color: colors.ink, fontSize: 17, lineHeight: 22 }}>
        {name}
      </Text>
      <View className="flex-row items-center gap-1.5" style={{ marginTop: 4 }}>
        <Icon as={Clock} size={15} color={colors.ink3} />
        <Text variant="subhead" style={{ color: colors.ink2, fontVariant: ['tabular-nums'] }}>
          {duration(minutes(subject), true)}
        </Text>
      </View>
    </Pressable>
  );
  return (
    <View className="flex-row" style={{ height: 140, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line }}>
      {half('english', 'Reading & Writing', toThrown(RW_OBJECTS, colors.english), false)}
      {half('math', 'Math', toThrown(MATH_OBJECTS, colors.math), true)}
    </View>
  );
}
