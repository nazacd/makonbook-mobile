import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import { Appearance } from 'react-native';
import { colorScheme as cssColorScheme } from 'react-native-css';

// The Appearance choice in Profile: follow the phone, or always light / dark.
// Saved on this phone only. Applied through React Native's Appearance, which
// NativeWind and useColorScheme() both follow, so every token switches at once.

export type AppearanceMode = 'system' | 'light' | 'dark';

const KEY = '@makonbook/appearance';

type AppearanceState = { mode: AppearanceMode; ready: boolean; setMode: (mode: AppearanceMode) => void };

const AppearanceContext = createContext<AppearanceState | null>(null);

function apply(mode: AppearanceMode) {
  // 'unspecified' hands the decision back to the phone's setting.
  const scheme = mode === 'system' ? 'unspecified' : mode;
  // Native chrome and useColorScheme() follow React Native's Appearance. The
  // classNames' colour variables follow react-native-css, which only hears
  // scheme changes that come from the native side, so it is told directly.
  Appearance.setColorScheme(scheme);
  cssColorScheme.set(scheme);
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppearanceMode>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(KEY)
      .catch(() => null)
      .then((saved) => {
        if (cancelled) return;
        const next: AppearanceMode = saved === 'light' || saved === 'dark' ? saved : 'system';
        // Always apply, 'system' included: builds made while the app was dark-only
        // force dark until told otherwise.
        apply(next);
        setModeState(next);
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = (next: AppearanceMode) => {
    apply(next);
    setModeState(next);
    AsyncStorage.setItem(KEY, next).catch(() => {});
  };

  return <AppearanceContext value={{ mode, ready, setMode }}>{children}</AppearanceContext>;
}

export function useAppearance(): AppearanceState {
  const value = use(AppearanceContext);
  if (!value) throw new Error('useAppearance must be used inside AppearanceProvider');
  return value;
}

/** The saved choice, or 'system' outside the provider (tests, the launch screen). */
export function useAppearanceMode(): AppearanceMode {
  return use(AppearanceContext)?.mode ?? 'system';
}
