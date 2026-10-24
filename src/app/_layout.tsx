import { QueryClientProvider } from '@tanstack/react-query';
import { Asset } from 'expo-asset';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { LaunchScreen, LAUNCH_LOGO } from '@/components/LaunchScreen';
import { UpdateRequired } from '@/components/UpdateRequired';
import { placementImages } from '@/data/assetMap';
import { colors } from '@/design/colors';
import { headerOptions } from '@/design/navigation';
import { connectFocusManager, createQueryClient, useUpdateRequired } from '@/lib/api/queries';
import { AuthProvider, useAuth } from '@/lib/auth/session';
import { ParentProvider, useParent } from '@/lib/parent/session';
import '../global.css';

SplashScreen.preventAutoHideAsync();

// Long enough that the spinner reads as "loading" rather than a one-frame
// flicker on fast devices, short enough not to slow down a cold start.
const MIN_LAUNCH_MS = 800;

const PRELOAD_ASSETS = [LAUNCH_LOGO, ...Object.values(placementImages)];

const queryClient = createQueryClient();

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.brand, card: colors.brand, primary: colors.accent },
};

export default function RootLayout() {
  const [assetsReady, setAssetsReady] = useState(false);

  useEffect(() => {
    const minDelay = new Promise((resolve) => setTimeout(resolve, MIN_LAUNCH_MS));
    // A failed preload only means an image loads lazily later — never block
    // the app on it.
    const preload = Asset.loadAsync(PRELOAD_ASSETS).catch(() => {});
    Promise.all([minDelay, preload]).then(() => setAssetsReady(true));
  }, []);

  useEffect(connectFocusManager, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ParentProvider>
            <ThemeProvider value={theme}>
              <RootNavigator />
              <Launch assetsReady={assetsReady} />
              <StatusBar style="light" />
            </ThemeProvider>
          </ParentProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

// The native splash can only show a static image, so it is swapped for an
// identical JS copy (plus a spinner) as soon as that copy has painted, which
// stays over the app until assets are loaded and we know whether someone is
// signed in — so the first screen people see is the right one.
function Launch({ assetsReady }: { assetsReady: boolean }) {
  const { status } = useAuth();
  const parent = useParent();
  if (assetsReady && status !== 'loading' && parent.ready) return null;
  return <LaunchScreen onLayout={() => SplashScreen.hide()} />;
}

function RootNavigator() {
  const { status } = useAuth();
  const parent = useParent();
  const updateRequired = useUpdateRequired();
  const signedIn = status === 'signedIn';
  // A parent's phone: children added with their codes, nobody signed in.
  const parentMode = !signedIn && parent.kids.length > 0;

  if (updateRequired) return <UpdateRequired />;
  // Until we know whether someone is signed in, render no routes at all (the
  // launch screen covers this moment). Otherwise the guards would treat the
  // person as signed out and redirect away from the URL the app was opened
  // with — losing, for example, a check-in link scanned with the camera.
  if (status === 'loading' || !parent.ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.brand } }}>
      {/* "/" is the Classes tab inside (app). Signed out, that is guarded and
          the router falls back to the first screen available: welcome, or a
          parent's home on a parent's phone. */}
      <Stack.Protected guard={!signedIn && !parentMode}>
        <Stack.Screen name="welcome" />
        <Stack.Screen name="parent-code" options={headerOptions} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      <Stack.Protected guard={parentMode}>
        <Stack.Screen name="parent" />
      </Stack.Protected>

      {/* A student can sign in on a parent's phone too (a shared phone). It
          comes after the parent's screens: a guard falls back to the first
          screen available, and on a parent's phone that is their home. */}
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="sign-in" options={{ ...headerOptions, title: 'Sign in' }} />
      </Stack.Protected>

      {/* The Level Check is public: no account, nothing leaves the device. */}
      <Stack.Screen name="level-check" options={{ ...headerOptions, title: 'Level Check' }} />
      <Stack.Screen name="placement/[subject]" />
    </Stack>
  );
}
