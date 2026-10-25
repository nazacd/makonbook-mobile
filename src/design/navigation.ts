import type { NativeStackNavigationOptions } from 'expo-router';
import { Platform } from 'react-native';

import { useColors, useScheme } from './colors';
import { fonts, type } from './typography';

const iosMajor = Platform.OS === 'ios' ? parseInt(String(Platform.Version), 10) : 0;

// Navigation bars float over the content as a translucent layer instead of
// taking a solid strip. iOS 26 does this itself (Liquid Glass with a scroll
// edge effect) once the header is transparent; earlier iOS versions get the
// system chrome material for the current scheme. Android has no system blur
// for headers, so it gets a solid bar in the app background with no line.
//
// Screens under a transparent header must let the system inset their scroll
// view: <ScrollView contentInsetAdjustmentBehavior="automatic">.
export function useHeaderOptions(): NativeStackNavigationOptions {
  const colors = useColors();
  const scheme = useScheme();
  return {
    headerShown: true,
    headerTintColor: colors.ink,
    headerTitleStyle: { color: colors.ink, fontSize: type.headline.fontSize, fontFamily: fonts.displaySemiBold },
    headerShadowVisible: false,
    headerBackButtonDisplayMode: 'minimal',
    ...(Platform.OS === 'ios'
      ? {
          headerTransparent: true,
          ...(iosMajor < 26 && {
            headerBlurEffect: scheme === 'dark' ? ('systemChromeMaterialDark' as const) : ('systemChromeMaterialLight' as const),
          }),
        }
      : { headerStyle: { backgroundColor: colors.bg } }),
  };
}

// Secondary tasks (change password, set a username) open as a sheet on iOS:
// it rises from the bottom, can be grabbed and swiped away at any point, and
// leaves the screen behind visibly in place. Android pushes a screen instead,
// which is what Android users expect for a form.
export function useSheetOptions(): NativeStackNavigationOptions {
  return { ...useHeaderOptions(), presentation: Platform.OS === 'ios' ? 'modal' : 'card' };
}
