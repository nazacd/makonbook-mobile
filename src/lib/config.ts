// Desmos API key for the graphing calculator, read from the environment at
// build time. Set EXPO_PUBLIC_DESMOS_API_KEY in a git-ignored `.env` file for
// local development (see `.env.example`) and as an EAS environment variable
// for builds. Request a key at https://www.desmos.com/api.
//
// EXPO_PUBLIC_ values are inlined into the app bundle, so this is not a secret
// from anyone who has the app, but it must never be committed to the repo.
export const DESMOS_API_KEY = process.env.EXPO_PUBLIC_DESMOS_API_KEY ?? '';
