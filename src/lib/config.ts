import { Platform } from 'react-native';

// Desmos API key for the graphing calculator, read from the environment at
// build time. Set EXPO_PUBLIC_DESMOS_API_KEY in a git-ignored `.env` file for
// local development (see `.env.example`) and as an EAS environment variable
// for builds. Request a key at https://www.desmos.com/api.
//
// EXPO_PUBLIC_ values are inlined into the app bundle, so this is not a secret
// from anyone who has the app, but it must never be committed to the repo.
export const DESMOS_API_KEY = process.env.EXPO_PUBLIC_DESMOS_API_KEY ?? '';

// Where "Update" sends people when this build is too old. The iOS link needs
// the numeric App Store id, which exists once the app is first submitted; until
// then iOS shows the message without a button.
const APP_STORE_ID = '';
const ANDROID_PACKAGE = 'com.nazacd.makonbookmobile';

export const STORE_URL: string | null =
  Platform.OS === 'android'
    ? `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`
    : Platform.OS === 'ios' && APP_STORE_ID
      ? `https://apps.apple.com/app/id${APP_STORE_ID}`
      : null;
