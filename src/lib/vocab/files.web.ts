import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Deck, Review } from './types';

// The web build (development only) keeps everything in storage and shows
// images from their links, which work for a few hours.

const deckKey = '@makonbook/vocab/web-deck';
const logKey = (person: string) => `@makonbook/vocab/${person}/web-log`;
let links: Record<string, string> = {};

export async function readDeck(): Promise<Deck | null> {
  const raw = await AsyncStorage.getItem(deckKey);
  return raw ? (JSON.parse(raw) as Deck) : null;
}

export async function writeDeck(deck: Deck): Promise<void> {
  await AsyncStorage.setItem(deckKey, JSON.stringify(deck));
}

export async function readLog(person: string): Promise<Review[]> {
  const raw = await AsyncStorage.getItem(logKey(person));
  return raw ? (JSON.parse(raw) as Review[]) : [];
}

export async function appendLog(person: string, reviews: Review[]): Promise<void> {
  await AsyncStorage.setItem(logKey(person), JSON.stringify([...(await readLog(person)), ...reviews]));
}

export function hasImage(file: string): boolean {
  return !!links[file];
}

export async function downloadImages(fresh: Record<string, string>): Promise<void> {
  links = { ...links, ...fresh };
}

export function imageUri(file: string): string {
  return links[file] ?? '';
}
