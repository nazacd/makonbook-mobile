import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { useColors, type Palette } from '@/design/colors';
import * as haptics from '@/design/haptics';
import { springs } from '@/design/motion';
import { useCheckIn } from '@/lib/api/attendance';
import { ApiError } from '@/lib/api/client';
import { describeError } from '@/lib/api/errors';
import type { ScannedCode } from '@/lib/attendance/code';
import { schoolClock } from '@/lib/schedule';

type CheckInResultProps = {
  code: ScannedCode;
  onDone: () => void;
  /** Offered when scanning again could help (the code had just changed). */
  onScanAgain?: () => void;
};

type Outcome = { tone: 'success' | 'warning' | 'error'; title: string; message: string; retry?: boolean };

function outcomeOf(error: unknown): Outcome {
  const code = error instanceof ApiError ? error.code : 'unknown';
  switch (code) {
    case 'code_expired':
      return { tone: 'warning', title: 'The code just changed', message: 'Scan the one on your teacher’s screen now.', retry: true };
    case 'invalid_code':
      return { tone: 'error', title: 'Not a valid code', message: 'This isn’t a MakonBook attendance code.', retry: true };
    case 'session_closed':
      return { tone: 'error', title: 'Attendance is closed', message: 'Your teacher has finished attendance for this lesson. Ask them to mark you.' };
    case 'not_in_roster':
      return { tone: 'error', title: 'You’re not on this lesson’s list', message: 'If you should be, ask your teacher to mark you, and the office to check your group.' };
    case 'device_already_used':
      return { tone: 'error', title: 'This phone was already used', message: 'It checked in another student for this lesson. Use your own phone, or ask your teacher to mark you.' };
    case 'marked_absent':
      return { tone: 'error', title: 'Marked absent', message: 'Your teacher marked you absent for this lesson. Talk to them if that’s wrong.' };
    case 'forbidden':
      return { tone: 'error', title: 'Students only', message: 'Only students check in with a code.' };
    default:
      return { tone: 'error', title: 'Couldn’t check you in', message: describeError(error), retry: true };
  }
}

// Sends one scanned code and shows the answer: a clear yes (present or late),
// or what went wrong and what to do about it.
export function CheckInResult({ code, onDone, onScanAgain }: CheckInResultProps) {
  const colors = useColors();
  const checkIn = useCheckIn();
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return; // once per code, also under StrictMode's double effects
    sent.current = true;
    checkIn.mutate(code, {
      // The haptic fires with the answer appearing, not before or after.
      onSuccess: (r) => (r.already ? haptics.selection() : haptics.success()),
      onError: () => haptics.error(),
    });
  }, [checkIn, code]);

  let outcome: Outcome | null = null;
  if (checkIn.isSuccess) {
    const r = checkIn.data;
    const when = schoolClock(Date.parse(r.at));
    outcome = r.already
      ? { tone: 'success', title: 'Already checked in', message: `${r.group_name}. You don’t need to scan again.` }
      : r.state === 'late'
        ? { tone: 'warning', title: 'Checked in — late', message: `${r.group_name} · ${when}` }
        : { tone: 'success', title: 'You’re checked in', message: `${r.group_name} · ${when}` };
  } else if (checkIn.isError) {
    outcome = outcomeOf(checkIn.error);
  }

  return (
    <View className="flex-1 bg-brand">
      <SafeAreaView style={{ flex: 1 }}>
        <View className="flex-1 px-6 pb-4">
          <View className="flex-1 items-center justify-center gap-6">
            {outcome ? (
              <>
                <Badge tone={outcome.tone} />
                <View className="items-center gap-2">
                  <Text variant="title" className="text-ink" style={{ textAlign: 'center' }} accessibilityRole="header">
                    {outcome.title}
                  </Text>
                  <Text variant="body" style={{ color: colors.ink2, textAlign: 'center' }} accessibilityLiveRegion="polite">
                    {outcome.message}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <ActivityIndicator size="large" color={colors.accent} />
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

const BADGE: Record<Outcome['tone'], { tone: keyof Palette; mark: string }> = {
  success: { tone: 'good', mark: '✓' },
  warning: { tone: 'watch', mark: '!' },
  error: { tone: 'bad', mark: '✕' },
};

// The result mark grows into place with the default (non-bouncing) spring;
// with Reduce Motion it fades in instead.
function Badge({ tone }: { tone: Outcome['tone'] }) {
  const colors = useColors();
  const reduceMotion = useReducedMotion();
  const shown = useSharedValue(0);
  useEffect(() => {
    shown.value = withSpring(1, springs.default);
  }, [shown]);
  const style = useAnimatedStyle(() =>
    reduceMotion ? { opacity: shown.value } : { opacity: shown.value, transform: [{ scale: 0.6 + 0.4 * shown.value }] },
  );
  const { mark } = BADGE[tone];
  const color = colors[BADGE[tone].tone];
  return (
    <Animated.View
      style={[
        { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: `${color}26` },
        style,
      ]}>
      <View style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: color }}>
        <Text style={{ fontSize: 40, lineHeight: 46, fontWeight: '700', color: colors.bg }}>{mark}</Text>
      </View>
    </Animated.View>
  );
}
