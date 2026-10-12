import type { NativeStackNavigationOptions } from 'expo-router';
import { Platform } from 'react-native';

import { colors } from './colors';
import { type } from './typography';

const iosMajor = Platform.OS === 'ios' ? parseInt(String(Platform.Version), 10) : 0;

// Navigation bars float over the content as a translucent layer instead of
// taking a solid strip. iOS 26 does this itself (Liquid Glass with a scroll
// edge effect) once the header is transparent; earlier iOS versions get the
// system dark chrome material. Android has no system blur for headers, so it
// gets a solid bar in the app background with no dividing line.
//
// Screens under a transparent header must let the system inset their scroll
// view: <ScrollView contentInsetAdjustmentBehavior="automatic">.
export const headerOptions: NativeStackNavigationOptions = {
  headerShown: true,
  headerTintColor: colors.accent,
  headerTitleStyle: { color: colors.text, fontSize: type.headline.fontSize, fontWeight: '600' },
  headerShadowVisible: false,
  headerBackButtonDisplayMode: 'minimal',
  ...(Platform.OS === 'ios'
    ? { headerTransparent: true, ...(iosMajor < 26 && { headerBlurEffect: 'systemChromeMaterialDark' as const }) }
    : { headerStyle: { backgroundColor: colors.brand } }),
};

// Secondary tasks (change password, set a username) open as a sheet on iOS:
// it rises from the bottom, can be grabbed and swiped away at any point, and
// leaves the screen behind visibly in place. Android pushes a screen instead,
// which is what Android users expect for a form.
export const sheetOptions: NativeStackNavigationOptions = {
  ...headerOptions,
  presentation: Platform.OS === 'ios' ? 'modal' : 'card',
};

