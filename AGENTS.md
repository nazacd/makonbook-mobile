# AGENTS.md

## Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code. This applies generally: don't assume behavior from older Expo/React Native/library knowledge — check current docs or source for anything version-sensitive.

## Project

**SAT MAKON** — an Expo Router + React Native app. The only feature built so far is the **Level Check (Placement) Test**: an offline, anonymous, in-person placement test (Math or English, 50 questions, 60-minute timer) that recommends a starting class level. Full spec: `sat-makon-placement-test-spec.md` (repo root) — read it before changing test-flow/scoring behavior, it documents the data model, screen flow, and the level-estimation algorithm's intentional design (e.g. why a student strong on `hard` but weak on `easy` still gets placed at Foundation — not a bug).

### Structure
```
src/
  app/
    index.tsx                                    Home
    placement/[subject]/
      _layout.tsx                                validates subject, hosts SessionProvider
      instructions.tsx, test.tsx, results.tsx
      review/[questionId].tsx
  data/placement/{math,english}.json              50-question banks, assetMap.ts for bundled images
  lib/                                            session-context (test state + AsyncStorage resume),
                                                   scoring.ts, gradeAnswer.ts, timer.ts, storage.ts, types.ts
  components/                                     QuestionCard, AnswerChoice, GridInInput, Timer,
                                                   QuestionNavigatorGrid, BottomNavBar, MathText, HomeIcon
```

### Design system

Fixed single dark theme — **no `dark:` NativeWind variants anywhere**, no light mode. Color tokens live in `src/global.css`'s `@theme` block:
- `--color-brand: #01000f` — base app background, used everywhere.
- `--color-surface: #16141d` — cards, panels, inputs (a lifted near-black, distinct from the base).
- `--color-accent: #8b5cf6` — buttons, selected states, links, "current" nav cell. Kept deliberately separate from `brand`/`surface` because a near-black-on-near-black interactive element is invisible — always use `accent` for anything tappable that needs to stand out, never `brand`/`surface`.

Math content may contain inline LaTeX (`\( ... \)`); always render question/option text through `<MathText>` (`src/components/MathText.tsx`), never a raw `<Text>`, so it degrades correctly either way.

## Gotchas found the hard way (read before touching styling, deps, or native builds)

These cost real debugging time this session. Don't rediscover them.

1. **`metro.config.js` must actually call `withNativewind(config)`** — `module.exports = config` (forgetting to wrap it) compiles fine and even makes `expo export --platform web` work perfectly, but silently disables NativeWind's native transform entirely. Symptom: `className` is a complete no-op on native (no crash, just unstyled — default colors, no flex/centering), while web looks correct. Web styling comes from a separate, independent pipeline (Expo's built-in CSS-import support processing `global.css` via PostCSS), so it can't be used to verify native styling works.

2. **`react-native-css` must be pinned to exactly the version `nativewind`'s `peerDependencies` demands** (currently `3.1.0-rc.0` for `nativewind@5.0.0-rc.0` — check `node_modules/nativewind/package.json` if either gets bumped). A looser semver range that resolves to a different version installs, bundles, and even *runs* without error — it just makes native styling silently broken. `npm install`'s `ERESOLVE` peer-conflict error on this pair is a real signal, not noise to route around with `--legacy-peer-deps`.

3. **`lightningcss` must be pinned to `1.30.1`.** Versions `1.30.2+` have a confirmed upstream regression (see `nativewind/nativewind#1605` and related issues) that breaks parsing `global.css`'s `@import "tailwindcss/preflight.css" layer(base);` specifically on native (`SyntaxError: failed to deserialize; expected an object-like struct named Specifier, found ()`), while web is unaffected. Nothing in this repo's own dependency ranges pins it correctly by default — `@tailwindcss/node` wants `1.32.0` (also broken) and `@expo/metro-config` just wants `^1.30.1`; without an explicit override, npm hoists whatever satisfies the loosest range, which floats onto a broken version over time. Keep the explicit `"lightningcss": "1.30.1"` devDependency pin in `package.json`.

4. **`SafeAreaView` (from `react-native-safe-area-context`) does not support `className` on native.** `react-native-css` only patches a specific allowlist of components for `className` support (`src/components/` under its package — core RN primitives plus a few special-cased third-party ones like `SafeAreaProvider`); `SafeAreaView` itself is conspicuously absent and passes through untouched. Putting layout classes (`flex-1`, `items-center`, etc.) directly on `<SafeAreaView className="...">` is a silent no-op on native — content renders unstyled/uncentered, or collapses to zero height if a `ScrollView` depends on it for flex sizing. Always use:
   ```tsx
   <SafeAreaView style={{ flex: 1 }} edges={[...]}>
     <View className="flex-1 ...">...</View>
   </SafeAreaView>
   ```
   `style` (not `className`) on `SafeAreaView`; all real layout classes go on a nested `View`.

5. **Always verify both `npx expo export --platform web` and `npx expo export --platform android`** when touching anything styling- or native-dependency-related, not just web. Web has its own independent rendering/CSS path and can succeed while native is completely broken (this is exactly how gotchas #1, #3, and #4 above went unnoticed until on-device testing). `npx tsc --noEmit` catches type errors but none of these — none of them are type errors.

6. **After adding a new dynamic route segment** (e.g. a new `[param].tsx`), `npx tsc --noEmit` will fail on `router.push`/`Href` calls referencing it until `.expo/types/router.d.ts` is regenerated. That file is only regenerated by the Metro dev server (`npx expo start`), not by `expo export`. Run `npx expo start` briefly (it updates the file within a few seconds of boot) then stop it, before relying on `tsc` to validate new routes.

7. This app targets **Expo Go** (not a custom dev client) for testing — don't add native modules requiring custom native code/config plugins without checking Expo Go compatibility first; prefer pure-JS solutions (e.g. `react-native-mathjax-html-to-svg` was chosen specifically because it renders LaTeX via SVG with no WebView and no native module of its own).
