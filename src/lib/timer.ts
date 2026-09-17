import { useEffect, useReducer } from 'react';
import { AppState } from 'react-native';

export const TEST_DURATION_MS = 60 * 60 * 1000;

/**
 * Countdown derived from `duration - (now - startTimestamp)` on every tick,
 * never a naive decrement — survives backgrounding/screen lock without drift.
 */
export function useRemainingTime(startTimestamp: number | null, durationMs: number = TEST_DURATION_MS) {
  const [, forceTick] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    const id = setInterval(forceTick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') forceTick();
    });
    return () => subscription.remove();
  }, []);

  const remainingMs =
    startTimestamp == null ? durationMs : Math.max(0, durationMs - (Date.now() - startTimestamp));

  return { remainingMs, isExpired: remainingMs <= 0 };
}

export function formatRemainingTime(remainingMs: number): string {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
