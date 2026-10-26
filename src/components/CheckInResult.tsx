import { Check, Clock, Lock, RefreshCw, WifiOff, X, type LucideIcon } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { G } from 'react-native-svg';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { pick, random, SETS, SHAPES } from '@/components/SubjectSpill';
import { Text } from '@/components/Text';
import { useColors, type Palette } from '@/design/colors';
import * as haptics from '@/design/haptics';
import { springs } from '@/design/motion';
import { useCheckIn } from '@/lib/api/attendance';
import { ApiError } from '@/lib/api/client';
import { describeError } from '@/lib/api/errors';
import type { ScannedCode } from '@/lib/attendance/code';
import { parseClassName, type Level, type Subject } from '@/lib/groups';
import { schoolClock } from '@/lib/schedule';

type CheckInResultProps = {
  code: ScannedCode;
  onDone: () => void;
  /** Offered when scanning again could help. */
  onScanAgain?: () => void;
  /** The code changed while it was scanned: go back to the scanner instead of showing a screen. */
  onCodeChanged?: () => void;
};

type Badge = { fill: keyof Palette | null; icon: LucideIcon };
type Outcome = { badge: Badge; title: string; message: string; className?: string; retry?: boolean };

const GOOD: Badge = { fill: 'fillGood', icon: Check };
const LATE: Badge = { fill: 'fillWatch', icon: Clock };
const BAD: Badge = { fill: 'fillBad', icon: X };
// Neutral: nothing went wrong on the student's side.
const LOCKED: Badge = { fill: null, icon: Lock };

function outcomeOf(error: unknown): Outcome {
  const code = error instanceof ApiError ? error.code : 'unknown';
  switch (code) {
    case 'code_expired':
      return { badge: { fill: 'fillWatch', icon: RefreshCw }, title: 'The code just changed', message: 'Scan the one on your teacher’s screen now.', retry: true };
    case 'invalid_code':
      return { badge: BAD, title: 'Not a valid code', message: 'This isn’t a MakonBook attendance code.', retry: true };
    case 'network':
      // Checking in is the server's to record: nothing to keep for later.
      return {
        badge: { fill: null, icon: WifiOff },
        title: 'No internet',
        message: 'Checking in needs a connection. Turn on Wi-Fi or mobile data, then scan the code on your teacher’s screen again.',
        retry: true,
      };
    case 'session_closed':
      return { badge: LOCKED, title: 'Attendance is closed', message: 'Your teacher has finished attendance for this lesson. Ask them to mark you.' };
    case 'not_in_roster':
      return { badge: BAD, title: 'You’re not on this lesson’s list', message: 'If you should be, ask your teacher to mark you, and the office to check your group.' };
    case 'device_already_used':
      return { badge: BAD, title: 'This phone was already used', message: 'It checked in another student for this lesson. Use your own phone, or ask your teacher to mark you.' };
    case 'marked_absent':
      return { badge: BAD, title: 'Marked absent', message: 'Your teacher marked you absent for this lesson. Talk to them if that’s wrong.' };
    case 'forbidden':
      return { badge: BAD, title: 'Students only', message: 'Only students check in with a code.' };
    default:
      return { badge: BAD, title: 'Couldn’t check you in', message: describeError(error), retry: true };
  }
}

/** Back to Classes this long after a check-in went through. */
const AUTO_RETURN_MS = 2000;

// Sends one scanned code and shows the answer: a clear yes (present or late),
// or what went wrong and what to do about it. A yes goes back by itself.
export function CheckInResult({ code, onDone, onScanAgain, onCodeChanged }: CheckInResultProps) {
  const colors = useColors();
  const checkIn = useCheckIn();
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return; // once per code, also under StrictMode's double effects
    sent.current = true;
    checkIn.mutate(code, {
      // The haptic fires with the answer appearing, not before or after.
      onSuccess: (r) => (r.already ? haptics.selection() : haptics.success()),
      onError: (e) => {
        // From the scanner, a code that just changed isn't worth a screen: the
        // scanner comes back with a hint.
        if (onCodeChanged && e instanceof ApiError && e.code === 'code_expired') {
          onCodeChanged();
          return;
        }
        haptics.error();
      },
    });
  }, [checkIn, code, onCodeChanged]);

  useEffect(() => {
    if (!checkIn.isSuccess) return;
    const timer = setTimeout(onDone, AUTO_RETURN_MS);
    return () => clearTimeout(timer);
  }, [checkIn.isSuccess, onDone]);

  let outcome: Outcome | null = null;
  if (checkIn.isSuccess) {
    const r = checkIn.data;
    const name = parseClassName(r.group_name);
    const when = schoolClock(Date.parse(r.at));
    outcome = r.already
      ? { badge: GOOD, title: 'Already checked in', message: `${name.title}. You don’t need to scan again.`, className: r.group_name }
      : r.state === 'late'
        ? { badge: LATE, title: 'Checked in late', message: `${name.title} · ${when}`, className: r.group_name }
        : { badge: GOOD, title: 'You’re checked in', message: `${name.title} · ${when}`, className: r.group_name };
  } else if (checkIn.isError && !(onCodeChanged && checkIn.error instanceof ApiError && checkIn.error.code === 'code_expired')) {
    outcome = outcomeOf(checkIn.error);
  }
  const celebrate = checkIn.isSuccess && !checkIn.data.already && checkIn.data.state === 'present';
  const spillName = outcome?.className ? parseClassName(outcome.className) : null;

  return (
    <View className="flex-1 bg-brand">
      {celebrate && spillName?.subject && <Scatter subject={spillName.subject} level={spillName.isPrivate ? 'foundation' : (spillName.level ?? 'foundation')} seed={code.window} />}
      <SafeAreaView style={{ flex: 1 }}>
        <View className="flex-1 px-6 pb-4">
          <View className="flex-1 items-center justify-center gap-5">
            {outcome ? (
              <>
                <ResultBadge badge={outcome.badge} />
                <View className="items-center gap-2">
                  <Text variant="title" style={{ color: colors.ink, textAlign: 'center' }} accessibilityRole="header">
                    {outcome.title}
                  </Text>
                  <Text variant="body" style={{ color: colors.ink2, textAlign: 'center' }} accessibilityLiveRegion="polite">
                    {outcome.message}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <ActivityIndicator size="large" color={colors.ink2} />
                <Text variant="body" style={{ color: colors.ink2 }}>
                  Checking you in…
                </Text>
              </>
            )}
          </View>
          {outcome && (
            <View className="w-full max-w-md gap-3 self-center">
              {outcome.retry && onScanAgain && <Button label="Scan again" onPress={onScanAgain} />}
              <Button label="Done" variant={outcome.retry && onScanAgain ? 'secondary' : 'primary'} onPress={onDone} />
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

// The result mark grows into place with the default (non-bouncing) spring;
// with Reduce Motion it fades in instead.
function ResultBadge({ badge }: { badge: Badge }) {
  const colors = useColors();
  const reduceMotion = useReducedMotion();
  const shown = useSharedValue(0);
  useEffect(() => {
    shown.value = withSpring(1, springs.default);
  }, [shown]);
  const style = useAnimatedStyle(() =>
    reduceMotion ? { opacity: shown.value } : { opacity: shown.value, transform: [{ scale: 0.6 + 0.4 * shown.value }] },
  );
  const fill = badge.fill ? colors[badge.fill] : null;
  return (
    <Animated.View
      style={[
        { width: 108, height: 108, borderRadius: 54, alignItems: 'center', justifyContent: 'center', backgroundColor: fill ? `${fill}2e` : colors.surface2 },
        style,
      ]}>
      <View style={{ width: 78, height: 78, borderRadius: 39, alignItems: 'center', justifyContent: 'center', backgroundColor: fill ?? 'transparent' }}>
        <Icon as={badge.icon} size={40} color={fill ? colors.bg : colors.ink} strokeWidth={2.4} />
      </View>
    </Animated.View>
  );
}

// The class's own objects scattered in from both edges, in the subject's
// single colour: the one moment of celebration, for a check-in on time.
function Scatter({ subject, level, seed }: { subject: Subject; level: Level; seed: number }) {
  const colors = useColors();
  const reduceMotion = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const [objects] = useState(() => {
    const r = random(seed);
    const pool = SETS[subject][level].filter(([shape]) => shape !== 'plus' && shape !== 'times');
    return Array.from({ length: 10 }, (_, i) => {
      const left = i % 2 === 0;
      const t = r();
      return {
        x: left ? 14 + t * width * 0.16 : width - 14 - t * width * 0.16,
        y: height * (0.1 + 0.8 * r()),
        s: 1.5 + r() * 0.4,
        rot: Math.round(r() * 50 - 25),
        o: 0.14 + (1 - t) * 0.2,
        shape: pick(r, pool),
      };
    });
  });
  const color = subject === 'Math' ? colors.math : colors.english;
  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(400)}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Svg width={width} height={height}>
        {objects.map((o, i) => (
          <G key={i} opacity={o.o} transform={`translate(${o.x.toFixed(1)} ${o.y.toFixed(1)}) rotate(${o.rot}) scale(${o.s.toFixed(2)})`}>
            {SHAPES[o.shape](color)}
          </G>
        ))}
      </Svg>
    </Animated.View>
  );
}
