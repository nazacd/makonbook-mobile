import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AnswerInput, OwnAttempt, Score, ServerAttempt, Subject } from './types';

// What the phone keeps about practice tests, per person (a shared phone keeps
// each student's tests and attempts apart): which versions are downloaded,
// the test in progress, and finished attempts — with every answer, for the
// review — until and after they are uploaded.

export type Person = string; // "student-123"

export type Download = { code: string; title: string; version: number; bytes: number; at: string };

/** A test being taken. Modules run one after another; time is kept as time used, so leaving pauses it. */
export type Run = {
  id: string;
  code: string;
  title: string;
  version: number;
  sections: Subject[];
  startedAt: string;
  /** Which module (in the order taken); `ready` until its timer is started. */
  stage: number;
  ready: boolean;
  elapsedMs: number;
  index: number;
  answers: Record<string, string>;
  seconds: Record<string, number>;
  marked: string[];
  eliminated: Record<string, string[]>;
  /**
   * The break between a full test's sections, while it's on: time left as of
   * `since` (when it last ran on), or paused (`since` null). It runs in real
   * time, also with the app in the background; only leaving with Home pauses it.
   */
  brk?: { leftMs: number; since: string | null };
};

export type LocalAttempt = {
  id: string;
  code: string;
  title: string;
  version: number;
  sections: Subject[];
  started_at: string;
  finished_at: string;
  answers: AnswerInput[];
  /** Graded on the phone; replaced by the server's once uploaded. */
  scores: Partial<Record<Subject, Score>>;
  total: number | null;
  uploaded: boolean;
  /** The server refused it (it won't be sent again). */
  rejected?: string;
};

const key = (person: Person, what: string) => `@makonbook/practice/${person}/${what}`;

async function read<T>(k: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(k);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const loadDownloads = (p: Person) => read<Record<string, Download>>(key(p, 'downloads'), {});

export async function saveDownload(p: Person, d: Download) {
  const all = await loadDownloads(p);
  await AsyncStorage.setItem(key(p, 'downloads'), JSON.stringify({ ...all, [d.code]: d }));
}

export async function forgetDownload(p: Person, code: string) {
  const all = await loadDownloads(p);
  delete all[code];
  await AsyncStorage.setItem(key(p, 'downloads'), JSON.stringify(all));
}

export const loadRun = (p: Person, code: string) => read<Run | null>(key(p, `run/${code}`), null);

export const saveRun = (p: Person, run: Run) => AsyncStorage.setItem(key(p, `run/${run.code}`), JSON.stringify(run));

export const clearRun = (p: Person, code: string) => AsyncStorage.removeItem(key(p, `run/${code}`));

/** Every test in progress, by code. */
export async function loadRuns(p: Person): Promise<Record<string, Run>> {
  const prefix = key(p, 'run/');
  const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(prefix));
  const out: Record<string, Run> = {};
  for (const [, raw] of await AsyncStorage.multiGet(keys)) {
    try {
      const run = raw ? (JSON.parse(raw) as Run) : null;
      if (run) out[run.code] = run;
    } catch {
      // A damaged entry is skipped.
    }
  }
  return out;
}

/** Finished attempts, latest first. */
/** When this teacher last left the Practice tab on this phone (ISO); results after it count as new. */
export const loadLastVisit = (p: Person) => read<string | null>(key(p, 'teacher-last-visit'), null);

export const saveLastVisit = (p: Person, at: string) => AsyncStorage.setItem(key(p, 'teacher-last-visit'), JSON.stringify(at));

export const loadAttempts = (p: Person) => read<LocalAttempt[]>(key(p, 'attempts'), []);

export async function saveAttempt(p: Person, attempt: LocalAttempt) {
  const all = await loadAttempts(p);
  const rest = all.filter((a) => a.id !== attempt.id);
  const next = [...rest, attempt].sort((a, b) => b.finished_at.localeCompare(a.finished_at));
  await AsyncStorage.setItem(key(p, 'attempts'), JSON.stringify(next));
}

/** Records the server's grading of an uploaded attempt. */
export async function markUploaded(p: Person, server: ServerAttempt) {
  const all = await loadAttempts(p);
  const a = all.find((x) => x.id === server.id);
  if (!a) return;
  await saveAttempt(p, { ...a, uploaded: true, scores: server.scores, total: server.total });
}

const fromServer = (s: OwnAttempt): LocalAttempt => ({
  id: s.id,
  code: s.test,
  title: s.title,
  version: s.version,
  sections: s.sections,
  started_at: s.started_at,
  finished_at: s.finished_at,
  answers: s.answers,
  scores: s.scores,
  total: s.total,
  uploaded: true,
});

/**
 * Brings the phone's attempts in line with the server's: keeps the ones this
 * phone doesn't have (taken on another phone, or before the app was installed
 * again), and for uploaded ones takes the server's copy, which is the record
 * (the demo account's results, for one, are made again with new dates).
 * Attempts not uploaded yet stay as they are. Returns how many changed.
 */
const sections: Subject[] = ['english', 'math'];

export async function mergeFromServer(p: Person, server: OwnAttempt[]): Promise<number> {
  const all = await loadAttempts(p);
  const byId = new Map(server.map((s) => [s.id, fromServer(s)]));
  let changed = 0;
  const next = all.map((a) => {
    const s = byId.get(a.id);
    byId.delete(a.id);
    const same =
      s &&
      s.finished_at === a.finished_at &&
      s.started_at === a.started_at &&
      s.version === a.version &&
      s.total === a.total &&
      s.answers.length === a.answers.length &&
      sections.every((sub) => s.scores[sub]?.score === a.scores[sub]?.score);
    if (!s || !a.uploaded || same) return a;
    changed++;
    return s;
  });
  for (const s of byId.values()) {
    next.push(s);
    changed++;
  }
  if (changed === 0) return 0;
  next.sort((a, b) => b.finished_at.localeCompare(a.finished_at));
  await AsyncStorage.setItem(key(p, 'attempts'), JSON.stringify(next));
  return changed;
}

export async function markRejected(p: Person, id: string, reason: string) {
  const all = await loadAttempts(p);
  const a = all.find((x) => x.id === id);
  if (a) await saveAttempt(p, { ...a, rejected: reason });
}
