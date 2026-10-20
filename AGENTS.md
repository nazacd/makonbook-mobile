# AGENTS.md

## Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code. This applies generally: don't assume behavior from older Expo/React Native/library knowledge — check current docs or source for anything version-sensitive.

## Project

**SAT MAKON / MakonBook** — an Expo Router + React Native app for SAT MAKON students (and teachers), backed by the Go API in `nazacd/makonbook-api` (`https://api.makonbook.uz`; the contract is that repo's `api/openapi.yaml`, the product plan its `docs/platform-spec.md`). Built so far: sign-in (phone number or username, temporary password = last 4 digits of the phone, forced change), the Classes tab (groups and schedules from `/v1/me`), attendance (QR), the **Practice** tab (SAT practice tests, below), Profile (username, password, sign out), the force-update screen, and the public **Level Check (Placement) Test**: an offline, anonymous, in-person placement test (Math or English, 50 questions, 60-minute timer) that recommends a starting class level. Full spec: `sat-makon-placement-test-spec.md` (repo root) — read it before changing test-flow/scoring behavior, it documents the data model, screen flow, and the level-estimation algorithm's intentional design (e.g. why a student strong on `hard` but weak on `easy` still gets placed at Foundation — not a bug).

### Structure
```
src/
  app/
    _layout.tsx                                  providers, launch screen, route guards, force update
    welcome.tsx, sign-in.tsx                     signed out only (Stack.Protected)
    (app)/                                       signed in only
      _layout.tsx                                loads /v1/me; guards choose-password vs everything else
      choose-password.tsx                        forced: the only screen until the temporary password is replaced
      password.tsx, username.tsx                 sheets from Profile
      attendance/[id].tsx                        teacher: rotating QR + live list while open; results + corrections after
      scan.tsx                                   student: camera scanner (full-screen modal from the tab bar's Scan button)
      att/[sessionId]/[window]/[sig].tsx         the QR's deep link (makonbookmobile://att/…): check in from the phone's camera
      my-attendance/[groupId].tsx                student: attendance in one group (opened from the group card on Classes)
      practice/test/[code].tsx                   a practice test: download/update, choose sections, start/continue, results
      practice/run/[code].tsx                    taking it: modules one after another, each timed; saved as you go, pauses when left
      practice/result/[id].tsx, review/[id]/[slot].tsx   scores, every question right/wrong/blank, each with its explanation
      practice/group/[id].tsx                    teacher: a group's students and their attempts
      (tabs)/_layout.tsx                         JS Tabs + AppTabBar (custom: students get a raised centre Scan button)
      (tabs)/index.tsx, practice.tsx, profile.tsx   "/" = StudentClasses or TeacherToday by role; Practice; Profile
    level-check.tsx                              public subject picker
    placement/[subject]/
      _layout.tsx                                validates subject, hosts SessionProvider
      instructions.tsx, test.tsx, results.tsx
      review/[questionId].tsx
  data/placement/{math,english}.json              50-question banks, assetMap.ts for bundled images
  design/                                         colors, typography (type scale), motion (springs),
                                                   haptics, navigation (header/sheet options)
  lib/api/                                        client (fetch, ApiError, token), types, queries + attendance (React Query hooks), errors
  lib/attendance/code.ts                          QR codes: HMAC signing (must match the API's internal/attendance/token.go), link format
  lib/practice/                                   practice tests: types (the API's PracticePackage etc.), hooks (catalog, download,
                                                   upload queue), files(.web).ts (packages + images on disk), local.ts (per-person
                                                   downloads, test in progress, finished attempts), grade.ts (must match the API's
                                                   internal/practice/scoring.go), run.ts (modules, start, finish)
  lib/confirm(.web).ts                            "are you sure?" — Alert on phones, window.confirm on web (RN Web has no Alert)
  lib/auth/                                       session (AuthProvider/useAuth), secure-storage, device id
  lib/                                            clock (useNow 30 s, useFastNow 250 ms), schedule (next class, school dates, Tashkent time);
                                                   placement: session-context, scoring, gradeAnswer, timer, storage, types
  components/                                     Button, PressableScale, TextField, Notice, ListRow, GroupCard,
                                                   PasswordForm, UpdateRequired, StateChip; attendance: TeacherToday,
                                                   StudentClasses, RotatingQR, MarkSheet, AppTabBar, TabIcons,
                                                   CheckInResult; placement: QuestionCard, AnswerChoice,
                                                   GridInInput, Timer, QuestionNavigatorGrid, BottomNavBar, MathText, …;
                                                   practice/: RichContent, StudentPractice, TeacherPractice
```

Routing rules: who can see what is decided only by `Stack.Protected` guards in the two layouts — screens never redirect themselves after a state change (a screen's effect runs before its parent layout re-renders the guard, so the navigation lands on a still-guarded route and bounces). To leave a screen when state changes, guard that screen too and let the router fall back. `/` is the Classes tab; signed out, the router falls back to `welcome`. The root layout renders no routes while the saved session is still loading, so an opening URL (a check-in link) isn't redirected away before we know who is signed in.

Server state lives in React Query (`useMe` is the person, seeded by the login response). The bearer token is in `expo-secure-store`; any 401 on an authenticated call signs out locally. Branch on `ApiError.code`, never on messages; `describeError` has the wording for codes a screen doesn't handle itself.

### Design system

Fixed single dark theme — **no `dark:` NativeWind variants anywhere**, no light mode. Color tokens live in `src/global.css`'s `@theme` block:
- `--color-brand: #01000f` — base app background, used everywhere.
- `--color-surface: #16141d` — cards, panels, inputs (a lifted near-black, distinct from the base).
- `--color-accent: #8b5cf6` — buttons, selected states, links, "current" nav cell. Kept deliberately separate from `brand`/`surface` because a near-black-on-near-black interactive element is invisible — always use `accent` for anything tappable that needs to stand out, never `brand`/`surface`.

Interaction and motion (the "apple-design" principles, applied to React Native):
- **Respond on press-in, not release.** Tappable surfaces use `PressableScale` (sinks on press-in, springs back) or `ListRow` (highlight on press-in). Never feedback only on `onPress`.
- **Springs, not durations**, via `src/design/motion.ts`: `spring(response, dampingRatio)` in Apple's terms. Default `springs.default` (critically damped, 0.35 s); bounce (`springs.momentum`) only after a gesture that carried momentum. Springs start from the current value, so everything stays interruptible.
- **Reduce Motion**: springs use `ReduceMotion.System`; components swap movement for opacity (`useReducedMotion`).
- **System chrome over custom**, with one deliberate exception: native-stack headers (`headerOptions`) are translucent on iOS (Liquid Glass on 26, blur material before), solid brand on Android. The tab bar is our own `AppTabBar` (JS tabs), because the student's raised centre Scan button can't live in a native tab bar. Scroll views under them use `contentInsetAdjustmentBehavior="automatic"`. Secondary tasks open with `sheetOptions` (iOS sheet, Android push).
- **Haptics only at meaningful moments** (`src/design/haptics.ts`: success, error, selection) — never on ordinary taps. Android uses `performAndroidHapticsAsync`, which needs no `VIBRATE` permission (it stays blocked in `app.json`).
- **Type**: use `<Text variant="…">` from the scale in `src/design/typography.ts` (size, weight and leading as a set; Android gets hand-tuned tracking, iOS's system font does its own). Avoid mixing `text-*`/`font-*` size classes with a variant.
- **Feedback**: validate inline as people type; put errors next to the field they're about; `Notice` for screen-level status. Every screen has a way out (the forced password screen has Sign out).

### Checks & config

- `npm run typecheck` and `npm run lint` must pass; CI runs both. React Compiler is enabled, so keep render pure (no `Date.now()`, ref writes, or synchronous `setState` in effects — the lint rules flag these).
- The Desmos key comes from `EXPO_PUBLIC_DESMOS_API_KEY` (`.env`, git-ignored; see `.env.example`). Never hard-code or commit it.
- `EXPO_PUBLIC_API_URL` overrides the API address (default `https://api.makonbook.uz`). Run the web dev server without `CI=1` when iterating — CI mode turns off Metro's file watching and serves stale code.

Math content may contain inline LaTeX (`\( ... \)`); always render question/option text through `<MathText>` (`src/components/MathText.tsx`), never a raw `<Text>`, so it degrades correctly either way.

**Practice tests** (the API's spec 9.5): tests are downloaded once (package JSON + images, in `Paths.document/practice`) and taken fully offline; finished attempts are kept per person on the phone and uploaded when online (`useUploadAttempts`: on the Practice screens and whenever the app comes back to the foreground; the attempt's UUID makes a repeat harmless). Their text is the API's content format (paragraphs, `\( \)`/`\[ \]`, `*i*`, `**b**`, `<u>`, lists, pipe tables, `![alt](r2:key)` images): render it with `<RichContent>`, never `<MathText>` — RichContent lays a paragraph out word by word so formulas sit inside the line, and only formulas go through MathJax (MathJax's own `$…$` delimiters would turn prices like "$29" into math). On web, MathJax's SVGs come out several times too large (its `ex` sizes are read as CSS `ex`); this is the library on web only, the placement test shows the same.

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
