import AsyncStorage from '@react-native-async-storage/async-storage';

// A person's vocabulary settings and sync state on this phone.

export type Settings = {
  /** The lists turned on, by slug. */
  active: string[];
  newPerDay: number;
  /** False until the person changes a setting on this phone. */
  saved?: boolean;
};

export const NEW_PER_DAY = [10, 20, 30, 50];

const key = (person: string, what: string) => `@makonbook/vocab/${person}/${what}`;

async function read<T>(k: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(k);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const loadSettings = (p: string) => read<Settings>(key(p, 'settings'), { active: [], newPerDay: 20, saved: false });
export const saveSettings = (p: string, s: Settings) =>
  AsyncStorage.setItem(key(p, 'settings'), JSON.stringify({ ...s, saved: true }));

/** Reviews made here that the server hasn't confirmed yet, by id. */
export const loadPending = (p: string) => read<string[]>(key(p, 'pending'), []);
export const savePending = (p: string, ids: string[]) => AsyncStorage.setItem(key(p, 'pending'), JSON.stringify(ids));

/** The last server seq this phone has fetched reviews up to. */
export const loadCursor = (p: string) => read<number>(key(p, 'cursor'), 0);
export const saveCursor = (p: string, seq: number) => AsyncStorage.setItem(key(p, 'cursor'), JSON.stringify(seq));
