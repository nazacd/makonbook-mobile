import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import { Appearance } from 'react-native';
import { colorScheme as cssColorScheme } from 'react-native-css';

// The Appearance choice in Profile: follow the phone, or always light / dark.
// Saved on this phone only.
//
// React Native's Appearance is left alone, so it always reports the phone's
// own setting (useColorScheme() follows it live). Overriding it from JS would
// hide that setting: after Appearance.setColorScheme('light'), switching back
// to 'unspecified' reads the old value until Android catches up, and nothing
// re-renders when it does. Instead the choice reaches the two places that
// draw colour: react-native-css's colour scheme (classNames' variables) and
// useScheme() in src/design/colors.ts (raw values), through this context.

export type AppearanceMode = 'system' | 'light' | 'dark';

const KEY = '@makonbook/appearance';

type AppearanceState = { mode: AppearanceMode; ready: boolean; setMode: (mode: AppearanceMode) => void };

const AppearanceContext = createContext<AppearanceState | null>(null);

function phoneScheme(): 'light' | 'dark' {
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

function applyToCss(mode: AppearanceMode) {
  // react-native-css compares its own value with prefers-color-scheme; with no
  // value it would count as light, so 'system' passes the phone's scheme.
  cssColorScheme.set(mode === 'system' ? phoneScheme() : mode);
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppearanceMode>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Builds made while the app was dark-only force dark natively; hand the
    // decision back to the phone once, at start.
    Appearance.setColorScheme('unspecified');
    let cancelled = false;
    AsyncStorage.getItem(KEY)
      .catch(() => null)
      .then((saved) => {
        if (cancelled) return;
        const next: AppearanceMode = saved === 'light' || saved === 'dark' ? saved : 'system';
        applyToCss(next);
        setModeState(next);
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // When the phone's setting changes, react-native-css follows it on its own.
  // That is right for 'system'; for a fixed choice, put the choice back.
  useEffect(() => {
    const sub = Appearance.addChangeListener(() => applyToCss(mode));
    return () => sub.remove();
  }, [mode]);

  const setMode = (next: AppearanceMode) => {
    applyToCss(next);
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
