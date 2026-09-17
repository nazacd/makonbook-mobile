import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PlacementSubject, StoredProgress } from './types';

function progressKey(subject: PlacementSubject): string {
  return `@makonbook/placement/in-progress/${subject}`;
}

export async function saveProgress(subject: PlacementSubject, progress: StoredProgress): Promise<void> {
  await AsyncStorage.setItem(progressKey(subject), JSON.stringify(progress));
}

export async function loadProgress(subject: PlacementSubject): Promise<StoredProgress | null> {
  const raw = await AsyncStorage.getItem(progressKey(subject));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredProgress;
  } catch {
    return null;
  }
}

export async function clearProgress(subject: PlacementSubject): Promise<void> {
  await AsyncStorage.removeItem(progressKey(subject));
}
