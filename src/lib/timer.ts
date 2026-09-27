import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export const TEST_DURATION_MS = 60 * 60 * 1000;

/**
 * Countdown derived from `duration - (now - startTimestamp)` on every tick,
 * never a naive decrement — survives backgrounding/screen lock without drift.
 * `now` is held in state and refreshed by the tick, so render stays pure.
 *
 * `enabled` (default true) stops the tick entirely — used to freeze the
 * countdown while the test screen isn't focused (e.g. the student navigated
 * to Home), so it can't keep expiring and auto-submitting in the background.
 * The caller is responsible for compensating `startTimestamp` for the time
 * spent unfocused once it refocuses (see test.tsx's useFocusEffect).
 */
export function useRemainingTime(
  startTimestamp: number | null,
  enabled: boolean = true,
  durationMs: number = TEST_DURATION_MS
) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return;
    const tick = () => setNow(Date.now());
    // Refresh immediately (next macrotask) when (re)enabled or when the start
    // timestamp shifts, so a stale `now` from before a pause never shows.
    const kick = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });
    return () => {
      clearTimeout(kick);
      clearInterval(id);
      subscription.remove();
    };
  }, [enabled, startTimestamp]);

  const remainingMs =
    startTimestamp == null ? durationMs : Math.min(durationMs, Math.max(0, durationMs - (now - startTimestamp)));

  return { remainingMs, isExpired: remainingMs <= 0 };
}

export function formatRemainingTime(remainingMs: number): string {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
