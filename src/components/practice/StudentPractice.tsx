import { router, useNavigation } from 'expo-router';
import { ArrowDown, ArrowRight, ArrowUp, BookOpen, ChevronDown, ChevronUp, CloudUpload, Download, Lock, RefreshCw, WifiOff } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { Icon } from '@/components/Icon';
import { EmptyState, ErrorState, Skeleton } from '@/components/States';
import { Text } from '@/components/Text';
import { ThrownObjects, type Thrown } from '@/components/ThrownObjects';
import { useColors, type Palette } from '@/design/colors';
import { fonts } from '@/design/typography';
import { describeError } from '@/lib/api/errors';
import { useCatalog, useDownloads, useLocalAttempts, useRuns, useUploadAttempts } from '@/lib/practice/hooks';
import type { LocalAttempt, Run } from '@/lib/practice/local';
import { formatBytes, SUBJECT_LABEL, SUBJECT_SHORT, testName, testRange } from '@/lib/practice/run';
import type { CatalogTest } from '@/lib/practice/types';

/** A run of this many finished tests in a row folds into one node. */
const FOLD_AT = 4;

type TestNode = {
  kind: 'test';
  test: CatalogTest;
  done: boolean;
  run?: Run;
  update: boolean;
  /** Not on the phone yet: its download size. */
  size?: number;
  latest?: LocalAttempt;
};
type Node = TestNode | { kind: 'fold'; tests: TestNode[] };

// The student's Practice tab: their latest full-test score, then the program
// as a path, test by test in order. Tests not open yet are one locked line at
// the end. (Teachers get TeacherPractice.)
export function StudentPractice() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const catalog = useCatalog();
  const downloads = useDownloads();
  const runs = useRuns();
  const attempts = useLocalAttempts();
  const upload = useUploadAttempts(true);
  const [unfolded, setUnfolded] = useState(false);
  const [pulling, setPulling] = useState(false);

  // The hero's objects are thrown in when the tab is opened from the tab bar,
  // not when coming back from a test.
  const navigation = useNavigation();
  const [play, setPlay] = useState(0);
  useEffect(
    () =>
      navigation.addListener('tabPress' as never, () => {
        if (!navigation.isFocused()) setPlay((p) => p + 1);
      }),
    [navigation],
  );

  const downloaded = downloads.data ?? {};
  const mine = attempts.data ?? []; // newest first
  // Offline: the tests on the phone still show, from what was downloaded.
  const tests: CatalogTest[] =
    catalog.data ??
    Object.values(downloaded).map((d) => ({
      code: d.code,
      title: d.title,
      english: 0,
      math: 0,
      questions: 0,
      approved: 0,
      version: d.version,
      bytes: d.bytes,
      published_at: null,
    }));
  const open = tests.filter((t) => t.version != null);
  const locked = tests.filter((t) => t.version == null);
  const pending = mine.filter((a) => !a.uploaded && !a.rejected).length;
  const fullScores = mine
    .filter((a) => a.total != null)
    .map((a) => a.total!)
    .reverse(); // oldest first

  const testNodes: TestNode[] = open.map((test) => {
    const d = downloaded[test.code];
    const latest = mine.find((a) => a.code === test.code);
    return {
      kind: 'test',
      test,
      done: !!latest,
      run: runs.data?.[test.code],
      update: !!(d && test.version && test.version > d.version),
      size: d ? undefined : (test.bytes ?? 0),
      latest,
    };
  });
  const folded = fold(testNodes);
  const foldHead = folded.find((n) => n.kind === 'fold')?.tests[0]?.test.code;
  const nodes = unfolded && foldHead ? testNodes : folded;
  const fresh = mine.length === 0 && Object.keys(runs.data ?? {}).length === 0;
  const startHere = fresh ? testNodes.find((n) => !n.done)?.test.code : undefined;

  return (
    <ScrollView
      className="flex-1 bg-brand"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 40, paddingHorizontal: 20 }}
      refreshControl={
        <RefreshControl
          refreshing={pulling}
          onRefresh={() => {
            setPulling(true);
            Promise.all([catalog.refetch(), upload.refetch()]).finally(() => setPulling(false));
          }}
          tintColor={colors.ink2}
          colors={[colors.ink]}
          progressBackgroundColor={colors.surface}
        />
      }>
      {fullScores.length > 0 && <ScoreHero scores={fullScores} play={play} />}

      {(pending > 0 || (catalog.isError && open.length > 0)) && (
        <View className="gap-2" style={{ marginBottom: 20 }}>
          {pending > 0 && <Quiet icon={CloudUpload} text={`${pending} ${pending === 1 ? 'result' : 'results'} waiting to send`} />}
          {catalog.isError && open.length > 0 && <Quiet icon={WifiOff} text="Offline: the tests on your phone" />}
        </View>
      )}

      {catalog.isPending && !downloads.data ? (
        <View className="gap-6" style={{ paddingTop: 8 }}>
          {[0, 1, 2].map((i) => (
            <View key={i} className="flex-row items-center gap-4">
              <Skeleton width={22} height={22} radius={11} />
              <Skeleton width="50%" height={20} />
            </View>
          ))}
        </View>
      ) : catalog.isError && open.length === 0 ? (
        <ErrorState title="Couldn’t load the tests" message={describeError(catalog.error)} onRetry={() => catalog.refetch()} retrying={catalog.isFetching} />
      ) : open.length === 0 && locked.length === 0 ? (
        <EmptyState icon={BookOpen} title="No tests yet" message="Tests appear here one by one as they’re ready." />
      ) : (
        <View>
          {nodes.map((node, i) => (
            <PathNode
              key={node.kind === 'test' ? node.test.code : 'fold'}
              node={node}
              first={i === 0}
              last={i === nodes.length - 1 && locked.length === 0}
              intoLocked={i === nodes.length - 1 && locked.length > 0}
              startHere={node.kind === 'test' && node.test.code === startHere}
              refold={unfolded && node.kind === 'test' && node.test.code === foldHead}
              onToggleFold={() => setUnfolded((u) => !u)}
            />
          ))}
          {locked.length > 0 && <LockedNode label={testRange(locked.map((t) => t.title))} first={nodes.length === 0} />}
        </View>
      )}
    </ScrollView>
  );
}

/** Folds a run of FOLD_AT or more finished tests (nothing in progress, no update waiting) into one node. */
function fold(nodes: TestNode[]): Node[] {
  const out: Node[] = [];
  let streak: TestNode[] = [];
  const flush = () => {
    if (streak.length >= FOLD_AT) out.push({ kind: 'fold', tests: streak });
    else out.push(...streak);
    streak = [];
  };
  for (const n of nodes) {
    if (n.done && !n.run && !n.update) streak.push(n);
    else {
      flush();
      out.push(n);
    }
  }
  flush();
  return out;
}

function Quiet({ icon, text }: { icon: typeof CloudUpload; text: string }) {
  const colors = useColors();
  return (
    <View className="flex-row items-center gap-2">
      <Icon as={icon} size={17} color={colors.ink3} />
      <Text variant="subhead" style={{ color: colors.ink2 }}>
        {text}
      </Text>
    </View>
  );
}

// Both subjects' objects (Advanced sets: these are SAT tests), resting along
// the screen's right edge, clear of the score, the change and the sparkline.
// [shape, subject colour, scale, right, top, opacity]: densest at the edge.
const HERO_OBJECTS: [string, keyof Palette, number, number, number, number][] = [
  ['pi', 'math', 1.15, -8, 2, 0.5],
  ['section', 'english', 1, 46, 0, 0.4],
  ['integral', 'math2', 1.3, 4, 52, 0.42],
  ['schwa', 'english', 0.9, 66, 48, 0.3],
  ['theta', 'math', 0.75, 100, 8, 0.16],
  ['ae', 'english2', 0.8, 50, 100, 0.32],
  ['root', 'math2', 0.75, 98, 98, 0.16],
];

function ScoreHero({ scores, play }: { scores: number[]; play: number }) {
  const colors = useColors();
  const last = scores[scores.length - 1]!;
  const change = scores.length > 1 ? last - scores[scores.length - 2]! : 0;
  const objects: Thrown[] = HERO_OBJECTS.map(([shape, color, scale, right, top, opacity]) => ({ shape, color: colors[color], scale, right, top, opacity }));
  return (
    <View
      style={{ marginBottom: 28, minHeight: 140 }}
      accessible
      accessibilityLabel={`Latest full test ${last}${change ? `, ${change > 0 ? 'up' : 'down'} ${Math.abs(change)}` : ''}`}>
      <View style={{ position: 'absolute', top: 0, bottom: 0, right: -20, width: 170 }}>
        <ThrownObjects items={objects} play={play} travel={(o) => o.right + 40} />
      </View>
      <Text variant="subhead" style={{ color: colors.ink2 }}>
        Latest full test
      </Text>
      <View className="flex-row items-baseline gap-3">
        <Text style={{ fontFamily: fonts.displayBold, fontSize: 64, lineHeight: 72, color: colors.ink, fontVariant: ['tabular-nums'] }} maxFontSizeMultiplier={1.2}>
          {last}
        </Text>
        {change !== 0 && (
          <View className="flex-row items-center">
            <Icon as={change > 0 ? ArrowUp : ArrowDown} size={20} strokeWidth={2.5} color={change > 0 ? colors.good : colors.bad} />
            <Text style={{ fontFamily: fonts.displayBold, fontSize: 20, color: change > 0 ? colors.good : colors.bad, fontVariant: ['tabular-nums'] }} maxFontSizeMultiplier={1.2}>
              {Math.abs(change)}
            </Text>
          </View>
        )}
      </View>
      {scores.length > 1 && <Sparkline scores={scores} />}
    </View>
  );
}

function Sparkline({ scores }: { scores: number[] }) {
  const colors = useColors();
  const w = 168;
  const h = 34;
  const lo = Math.min(...scores) - 20;
  const hi = Math.max(...scores) + 20;
  const points = scores.map((s, i) => [(i * w) / (scores.length - 1), h - ((s - lo) / (hi - lo)) * h] as const);
  const [lx, ly] = points[points.length - 1]!;
  return (
    <Svg width={w + 4} height={h + 4} style={{ marginTop: 8, overflow: 'visible' }}>
      <Polyline
        points={points.map(([x, y]) => `${x + 2},${y + 2}`).join(' ')}
        fill="none"
        stroke={colors.ink3}
        strokeWidth={1.75}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Circle cx={lx + 2} cy={ly + 2} r={3.5} fill={colors.primary} />
    </Svg>
  );
}

// One stop on the path: the rail through a node, the test, and on the right
// what matters about it (score, download size, or where you stopped).
function PathNode({
  node,
  first,
  last,
  intoLocked,
  startHere,
  refold,
  onToggleFold,
}: {
  node: Node;
  first: boolean;
  last: boolean;
  intoLocked: boolean;
  startHere: boolean;
  /** The first of the finished tests shown unfolded: it folds them again. */
  refold: boolean;
  onToggleFold: () => void;
}) {
  const colors = useColors();

  if (node.kind === 'fold') {
    const label = testRange(node.tests.map((n) => n.test.title));
    return (
      <Row first={first} last={last} intoLocked={intoLocked} dot={<Dot kind="fold" />} onPress={onToggleFold} label={`${label}, ${node.tests.length} done`} expanded={false}>
        <View className="flex-1 gap-0.5">
          <Text variant="title3" style={{ color: colors.ink }}>
            {label}
          </Text>
          <Text variant="subhead" style={{ color: colors.ink2 }}>
            {node.tests.length} done
          </Text>
        </View>
        <Icon as={ChevronDown} size={20} color={colors.ink3} />
      </Row>
    );
  }

  const { test, done, run, update, size, latest } = node;
  const name = testName(test.title);
  const score = latest ? (latest.total != null ? String(latest.total) : `${SUBJECT_SHORT[latest.sections[0]!]} ${latest.scores[latest.sections[0]!]?.score}`) : null;
  const where = run ? `${run.sections.length > 1 ? 'Full test' : SUBJECT_LABEL[run.sections[0]!]} · Part ${run.stage + 1}` : null;
  const sub = run ? where : update ? 'Update available' : startHere ? 'Start here' : null;
  const label = [name, run && `in progress, ${where}`, update && 'update available', score && (run ? `last ${score}` : score), size != null && `download, ${formatBytes(size)}`, startHere && 'start here']
    .filter(Boolean)
    .join(', ');

  return (
    <Row
      first={first}
      last={last}
      intoLocked={intoLocked}
      dot={<Dot kind={run ? 'run' : update ? (done ? 'updateDone' : 'update') : done ? 'done' : 'open'} />}
      onPress={() => router.push({ pathname: '/practice/test/[code]', params: { code: test.code } })}
      label={label}>
      <View className="flex-1 gap-0.5">
        <Text variant="title3" style={{ color: colors.ink }}>
          {name}
        </Text>
        {sub && (
          <View className="flex-row items-center gap-1">
            {run && <Icon as={ArrowRight} size={15} strokeWidth={2.25} color={colors.accent} />}
            <Text variant="subhead" style={{ color: run ? colors.accent : update ? colors.watch : colors.ink2, fontWeight: run ? '500' : '400' }}>
              {sub}
            </Text>
          </View>
        )}
      </View>
      {refold ? (
        <Pressable onPress={onToggleFold} hitSlop={12} accessibilityRole="button" accessibilityLabel="Fold finished tests">
          <Icon as={ChevronUp} size={20} color={colors.ink3} />
        </Pressable>
      ) : null}
      {score && latest?.total != null ? (
        <Text
          style={{ fontFamily: run ? fonts.displaySemiBold : fonts.displayBold, fontSize: run ? 19 : 22, color: run ? colors.ink3 : colors.ink, fontVariant: ['tabular-nums'] }}
          maxFontSizeMultiplier={1.2}>
          {score}
        </Text>
      ) : score ? (
        <Text variant="subhead" style={{ color: colors.ink2, fontVariant: ['tabular-nums'] }}>
          {score}
        </Text>
      ) : size != null ? (
        <View className="flex-row items-center gap-1.5">
          <Icon as={Download} size={18} color={colors.ink2} />
          <Text variant="subhead" style={{ color: colors.ink2, fontWeight: '500', fontVariant: ['tabular-nums'] }}>
            {formatBytes(size)}
          </Text>
        </View>
      ) : null}
    </Row>
  );
}

function LockedNode({ label, first }: { label: string; first: boolean }) {
  const colors = useColors();
  return (
    <View className="flex-row items-stretch gap-4" style={{ minHeight: 60, opacity: 0.55 }} accessible accessibilityLabel={`${label}, not open yet`}>
      <Rail top={!first} faded bottom={false} dot={<Dot kind="locked" />} />
      <View className="flex-1 justify-center">
        <Text variant="callout" style={{ color: colors.ink2 }}>
          {label}
        </Text>
      </View>
    </View>
  );
}

function Row({
  first,
  last,
  intoLocked,
  dot,
  onPress,
  label,
  expanded,
  children,
}: {
  first: boolean;
  last: boolean;
  intoLocked: boolean;
  dot: ReactNode;
  onPress: () => void;
  label: string;
  expanded?: boolean;
  children: ReactNode;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={expanded == null ? undefined : { expanded }}
      style={({ pressed }) => ({ marginHorizontal: -20, paddingHorizontal: 20, backgroundColor: pressed ? colors.surface2 : 'transparent' })}>
      <View className="flex-row items-stretch gap-4" style={{ minHeight: 68 }}>
        <Rail top={!first} bottom={!last} fadedBottom={intoLocked} dot={dot} />
        <View className="flex-1 flex-row items-center gap-3" style={{ paddingVertical: 10 }}>
          {children}
        </View>
      </View>
    </Pressable>
  );
}

// The rail through a node: a segment above, the node, a segment below. The
// segment into the locked line at the end is faded.
function Rail({ top, bottom, dot, faded, fadedBottom }: { top: boolean; bottom: boolean; dot: ReactNode; faded?: boolean; fadedBottom?: boolean }) {
  const colors = useColors();
  const segment = (on: boolean, dim: boolean) => (
    <View style={{ flex: 1, width: 2, backgroundColor: on ? colors.lineStrong : 'transparent', opacity: dim ? 0.5 : 1 }} />
  );
  return (
    <View style={{ width: 22, alignItems: 'center' }}>
      {segment(top, !!faded)}
      {dot}
      {segment(bottom, !!fadedBottom)}
    </View>
  );
}

type DotKind = 'done' | 'fold' | 'run' | 'open' | 'update' | 'updateDone' | 'locked';

function Dot({ kind }: { kind: DotKind }) {
  const colors = useColors();
  const base = { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' } as const;
  switch (kind) {
    case 'done':
      return <View style={{ ...base, backgroundColor: colors.primary }} />;
    case 'fold':
      return (
        <View style={{ ...base, width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.bg }}>
          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: colors.primary }} />
        </View>
      );
    case 'run':
      return (
        <View style={{ ...base, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.accentTint }}>
          <View style={{ ...base, borderWidth: 3, borderColor: colors.accent, backgroundColor: colors.bg }} />
        </View>
      );
    case 'update':
      return (
        <View style={{ ...base, borderWidth: 2, borderColor: colors.watch, backgroundColor: colors.bg }}>
          <Icon as={RefreshCw} size={11} strokeWidth={2.5} color={colors.watch} />
        </View>
      );
    case 'updateDone':
      return (
        <View style={{ ...base, backgroundColor: colors.watch }}>
          <Icon as={RefreshCw} size={11} strokeWidth={2.5} color={colors.bg} />
        </View>
      );
    case 'locked':
      return (
        <View style={{ ...base, borderWidth: 2, borderColor: colors.lineStrong, backgroundColor: colors.bg }}>
          <Icon as={Lock} size={11} strokeWidth={2.5} color={colors.ink3} />
        </View>
      );
    default:
      return <View style={{ ...base, borderWidth: 2, borderColor: colors.lineStrong, backgroundColor: colors.bg }} />;
  }
}
