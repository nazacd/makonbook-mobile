import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AnswerInput, Score, ServerAttempt, Subject } from './types';

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

export async function markRejected(p: Person, id: string, reason: string) {
  const all = await loadAttempts(p);
  const a = all.find((x) => x.id === id);
  if (a) await saveAttempt(p, { ...a, rejected: reason });
}
