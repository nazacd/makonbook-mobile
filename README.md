# SAT MAKON — mobile

Expo Router + React Native app for SAT MAKON. The only feature so far is the
**Level Check (placement) test**: an offline, anonymous, in-person test (Math
or English, 50 questions, 60 minutes) that recommends a starting class —
Foundation, Pre-SAT or Advanced.

- Product spec: [`sat-makon-placement-test-spec.md`](sat-makon-placement-test-spec.md)
  — read it before changing the test flow, timer or scoring.
- Contributor notes and known pitfalls: [`AGENTS.md`](AGENTS.md) — read it
  before touching styling, dependencies or native builds.

## Getting started

```bash
npm install
cp .env.example .env   # then fill in EXPO_PUBLIC_DESMOS_API_KEY
npx expo start
```

Open the app in Expo Go, an emulator, or a web browser from the Expo CLI.

### Environment variables

| Variable | Used for |
|---|---|
| `EXPO_PUBLIC_DESMOS_API_KEY` | Graphing calculator on Math questions. Request a key at <https://www.desmos.com/api>. Without it the calculator shows a "not configured" message; everything else works. |

`.env` is git-ignored. For EAS builds, set the same variable as an
[EAS environment variable](https://docs.expo.dev/eas/environment-variables/)
instead. Never commit the key: `EXPO_PUBLIC_` values are bundled into the app.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Start the Metro dev server |
| `npm run android` / `ios` / `web` | Start and open on a platform |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (`eslint-config-expo`) |

CI (`.github/workflows/ci.yml`) runs `typecheck` and `lint` on every push to
`main` and on pull requests. When changing styling or native dependencies,
also check `npx expo export --platform android` and `--platform web` — see
`AGENTS.md` for why web alone isn't enough.

## Placement scoring

Each question is tagged `easy`, `medium` or `hard`. The recommendation is a
staircase over per-tier scores, with thresholds in `MASTERY_THRESHOLDS`
(`src/lib/scoring.ts`):

1. easy < 75% → **Foundation**
2. medium < 60% → **Pre-SAT**
3. hard < 40% → **Pre-SAT**
4. otherwise → **Advanced**

## Known risks

- **Pre-release styling stack.** NativeWind 5 has no stable release yet; the
  app pins `nativewind@5.0.0-rc.0` with the exact `react-native-css@3.1.0-rc.0`
  it requires, and `lightningcss@1.30.1` to avoid a known regression. Keep
  these pins exact, re-test on a real device after any bump, and move to the
  stable 5.0 release when it ships. Details in `AGENTS.md`.
- **Calculator needs internet.** Desmos loads from its CDN at runtime; the
  rest of the test works fully offline.

## License

Proprietary — all rights reserved. See [`LICENSE`](LICENSE).
