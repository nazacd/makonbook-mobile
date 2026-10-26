import AsyncStorage from '@react-native-async-storage/async-storage';
import type { QueryClient, QueryKey } from '@tanstack/react-query';

// The few answers the app needs to open without a connection, kept on the
// phone for the person signed in: their profile (name, groups, schedules),
// their parent code, their attendance figures and the practice catalogue. Restored at launch as
// stale data, so the screens show at once and refetch in the background; saved
// again after every answer; deleted on sign-out.

const KEYS: { query: QueryKey; storage: string }[] = [
  { query: ['me'], storage: '@makonbook/saved/me' },
  { query: ['me', 'parent-code'], storage: '@makonbook/saved/parent-code' },
  { query: ['my-attendance'], storage: '@makonbook/saved/my-attendance' },
  { query: ['practice-catalog'], storage: '@makonbook/saved/practice-catalog' },
];

const same = (a: QueryKey, b: QueryKey) => a.length === b.length && a.every((x, i) => x === b[i]);

type Saved = { data: unknown; at: number };

/** Puts what was saved back into the cache, marked stale (so it refetches) but dated when it was fetched. */
export async function restoreSaved(queryClient: QueryClient) {
  await Promise.all(
    KEYS.map(async ({ query, storage }) => {
      try {
        const raw = await AsyncStorage.getItem(storage);
        if (!raw) return;
        const saved = JSON.parse(raw) as Saved;
        if (queryClient.getQueryData(query) === undefined) queryClient.setQueryData(query, saved.data, { updatedAt: saved.at });
      } catch {
        // A broken entry only means it loads from the network.
      }
    }),
  );
}

/** Saves each kept answer whenever it changes. Returns the unsubscribe. */
export function keepSaved(queryClient: QueryClient) {
  return queryClient.getQueryCache().subscribe((event) => {
    if (event.type !== 'updated' || event.action.type !== 'success') return;
    const entry = KEYS.find((k) => same(k.query, event.query.queryKey));
    const data = event.query.state.data;
    if (!entry || data === undefined) return;
    const saved: Saved = { data, at: event.query.state.dataUpdatedAt };
    AsyncStorage.setItem(entry.storage, JSON.stringify(saved)).catch(() => {});
  });
}

export function deleteSaved() {
  return AsyncStorage.multiRemove(KEYS.map((k) => k.storage)).catch(() => {});
}
