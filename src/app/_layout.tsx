import { Asset } from 'expo-asset';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { LaunchScreen, LAUNCH_LOGO } from '@/components/LaunchScreen';
import { placementImages } from '@/data/assetMap';
import '../global.css';

SplashScreen.preventAutoHideAsync();

// Long enough that the spinner reads as "loading" rather than a one-frame
// flicker on fast devices, short enough not to slow down a cold start.
const MIN_LAUNCH_MS = 800;

const PRELOAD_ASSETS = [LAUNCH_LOGO, ...Object.values(placementImages)];

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const minDelay = new Promise((resolve) => setTimeout(resolve, MIN_LAUNCH_MS));
    // A failed preload only means an image loads lazily later — never block
    // the app on it.
    const preload = Asset.loadAsync(PRELOAD_ASSETS).catch(() => {});
    Promise.all([minDelay, preload]).then(() => setReady(true));
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DarkTheme}>
        <Stack screenOptions={{ headerShown: false }} />
        {/* The native splash can only show a static image, so swap it for an
            identical JS copy (plus a spinner) as soon as that copy has painted,
            and keep it over the app until assets are ready. */}
        {!ready && <LaunchScreen onLayout={() => SplashScreen.hide()} />}
        <StatusBar style="light" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
