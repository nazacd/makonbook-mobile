// REQUIRED MANUAL STEP: register for a free API key at https://www.desmos.com/api
// and paste it below — until then the calculator panel will show its
// "no internet" fallback even when online, since Desmos's script won't init
// without a valid key. Loaded live from Desmos's CDN at runtime (not bundled),
// so it isn't a build secret in the usual sense, but don't ship a real
// production key if this repo is ever made public.
export const DESMOS_API_KEY = '5c78ee2ee7d441e4b61576cf8cb48f49';
