// Side-effect CSS imports (e.g. `import '../global.css'`) are handled by
// Metro/NativeWind at bundle time; this lets `tsc` accept them without
// depending on the git-ignored, dev-server-generated `expo-env.d.ts`.
declare module '*.css';
