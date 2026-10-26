import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import type { Card, Grade } from 'ts-fsrs';

import { api } from '@/lib/api/client';
import { usePerson } from '@/lib/practice/hooks';

import { appendLog, downloadImages, hasImage, readDeck, readLog, writeDeck } from './files';
import { loadCursor, loadPending, loadSettings, saveCursor, savePending, saveSettings, type Settings } from './local';
import { activeLists, rate, replay, type Cards } from './scheduler';
import type { Deck, GroupVocabStudent, Review } from './types';

export type VocabState = { log: Review[]; cards: Cards };

const deckKey = ['vocab-deck'] as const;
const stateKey = (person: string) => ['vocab-state', person] as const;
const settingsKey = (person: string) => ['vocab-settings', person] as const;

// The pending list is changed by ratings and by uploads; one at a time.
let lock: Promise<unknown> = Promise.resolve();
function locked<T>(fn: () => Promise<T>): Promise<T> {
  const run = lock.then(fn, fn);
  lock = run.catch(() => {});
  return run;
}

/** The deck on this phone (null until the first download). */
export function useDeck() {
  return useQuery({ queryKey: deckKey, queryFn: readDeck, staleTime: Infinity });
}

/** The person's review log and the cards it adds up to. */
export function useVocabState() {
  const person = usePerson();
  return useQuery({
    queryKey: stateKey(person),
    queryFn: async (): Promise<VocabState> => {
      const log = await readLog(person);
      return { log, cards: replay(log) };
    },
    staleTime: Infinity,
  });
}

export function useSettings() {
  const person = usePerson();
  return useQuery({ queryKey: settingsKey(person), queryFn: () => loadSettings(person), staleTime: Infinity });
}

export function useSaveSettings() {
  const person = usePerson();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (s: Settings) => {
      // Now chosen on this phone: no longer the new-phone default.
      const next = { ...s, saved: true };
      queryClient.setQueryData(settingsKey(person), next);
      await saveSettings(person, next);
    },
    // A list just turned on may have images to fetch.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vocab-sync', person] }),
  });
}

/**
 * Records a rating: appended to the log (and the upload queue) and applied
 * to that one card, so the screen updates at once without replaying the log.
 */
export function useRecordReview() {
  const person = usePerson();
  const queryClient = useQueryClient();
  return async (wordId: string, card: Card | undefined, rating: Grade, durationMs: number) => {
    const { card: next, review } = rate(card, wordId, rating, new Date(), durationMs, Crypto.randomUUID());
    queryClient.setQueryData<VocabState>(stateKey(person), (s) => {
      const cards = new Map(s?.cards);
      cards.set(wordId, next);
      return { log: [...(s?.log ?? []), review], cards };
    });
    await locked(async () => {
      await appendLog(person, [review]);
      await savePending(person, [...(await loadPending(person)), review.id]);
    });
    return review;
  };
}

const CHUNK = 200;

/**
 * Brings the phone and the server together: a newer deck, the reviews made
 * here (uploaded), the ones made on other phones (fetched and merged), and
 * the images of the lists turned on. Runs when the Words screens are shown
 * and whenever the app comes back to the foreground; offline it fails
 * quietly and studying goes on.
 */
export function useVocabSync(enabled: boolean) {
  const person = usePerson();
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['vocab-sync', person],
    enabled,
    staleTime: 0,
    retry: false,
    queryFn: async () => {
      // The deck.
      const have = queryClient.getQueryData<Deck | null>(deckKey) ?? (await readDeck());
      const res = await api.get<{ version: string; unchanged: boolean; lists?: Deck['lists'] }>(
        `/v1/vocab/deck${have?.version ? `?have=${encodeURIComponent(have.version)}` : ''}`,
      );
      let deck = have;
      if (!res.unchanged && res.lists) {
        deck = { version: res.version, lists: res.lists };
        await writeDeck(deck);
        queryClient.setQueryData(deckKey, deck);
      }

      // Reviews made here, up to the server.
      await locked(async () => {
        const pending = await loadPending(person);
        if (pending.length === 0) return;
        const waiting = new Set(pending);
        const log = await readLog(person);
        const toSend = log.filter((r) => waiting.has(r.id));
        for (let i = 0; i < toSend.length; i += CHUNK) {
          const batch = toSend.slice(i, i + CHUNK);
          await api.post('/v1/vocab/reviews', { reviews: batch });
          for (const r of batch) waiting.delete(r.id);
          await savePending(person, pending.filter((id) => waiting.has(id)));
        }
        // Ids with no log line (a cut-short write) can't be sent.
        await savePending(person, []);
      });

      // Reviews made on other phones, down to this one.
      let after = await loadCursor(person);
      const log = await readLog(person);
      const known = new Set(log.map((r) => r.id));
      const fresh: Review[] = [];
      for (;;) {
        const page = await api.get<{ reviews: (Review & { seq: number })[]; next: number | null }>(
          `/v1/me/vocab/reviews?after=${after}`,
        );
        for (const { seq, ...r } of page.reviews) {
          after = Math.max(after, seq);
          if (!known.has(r.id)) {
            known.add(r.id);
            fresh.push(r);
          }
        }
        if (page.next == null) break;
      }
      if (fresh.length > 0) {
        await locked(() => appendLog(person, fresh));
        const all = [...log, ...fresh];
        queryClient.setQueryData<VocabState>(stateKey(person), { log: all, cards: replay(all) });
      }
      await saveCursor(person, after);

      // Images of the lists turned on.
      const settings = await loadSettings(person);
      const state = queryClient.getQueryData<VocabState>(stateKey(person));
      const active = deck ? activeLists(settings, deck, state?.cards ?? replay(await readLog(person))) : [];
      for (const list of deck?.lists ?? []) {
        if (!active.includes(list.slug)) continue;
        if (list.words.every((w) => !w.image || hasImage(w.image.file))) continue;
        try {
          const links = await api.get<{ images: Record<string, string> }>(
            `/v1/vocab/lists/${encodeURIComponent(list.slug)}/images`,
          );
          await downloadImages(links.images);
        } catch {
          // Next time; the words work without their pictures.
        }
      }
      return { pending: (await loadPending(person)).length };
    },
  });
}

export const groupVocabKey = (groupId: string) => ['vocab-group', groupId] as const;

export const fetchGroupVocab = (groupId: string) =>
  api.get<{ words: number; students: GroupVocabStudent[] }>(`/v1/teacher/groups/${encodeURIComponent(groupId)}/vocab`);

export function useGroupVocab(groupId: string) {
  return useQuery({ queryKey: groupVocabKey(groupId), queryFn: () => fetchGroupVocab(groupId) });
}
