import { Directory, File, Paths } from 'expo-file-system';

import type { Deck, Review } from './types';

// On disk: the deck (one for everyone on this phone), the word images (shared,
// named by their bytes) and each person's review log, one JSON line per
// review, only ever appended to. AsyncStorage would be too small for years of
// reviews.

const root = new Directory(Paths.document, 'vocab');
const images = new Directory(root, 'img');
const deckFile = new File(root, 'deck.json');
const logFile = (person: string) => new File(root, person, 'log.jsonl');

export async function readDeck(): Promise<Deck | null> {
  if (!deckFile.exists) return null;
  return JSON.parse(await deckFile.text()) as Deck;
}

export async function writeDeck(deck: Deck): Promise<void> {
  root.create({ intermediates: true, idempotent: true });
  deckFile.write(JSON.stringify(deck));
}

export async function readLog(person: string): Promise<Review[]> {
  const file = logFile(person);
  if (!file.exists) return [];
  const out: Review[] = [];
  for (const line of (await file.text()).split('\n')) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line) as Review);
    } catch {
      // A line cut short (the app killed mid-write) is skipped; the server has it.
    }
  }
  return out;
}

export async function appendLog(person: string, reviews: Review[]): Promise<void> {
  if (reviews.length === 0) return;
  const file = logFile(person);
  if (!file.exists) {
    file.parentDirectory.create({ intermediates: true, idempotent: true });
    file.create();
  }
  file.write(reviews.map((r) => JSON.stringify(r) + '\n').join(''), { append: true });
}

export function hasImage(file: string): boolean {
  return new File(images, file).exists;
}

/** Downloads images not on the phone yet, a few at a time. */
export async function downloadImages(links: Record<string, string>): Promise<void> {
  images.create({ intermediates: true, idempotent: true });
  const queue = Object.keys(links).filter((f) => !hasImage(f));
  const worker = async () => {
    for (let name = queue.shift(); name; name = queue.shift()) {
      // Into a temporary file first: a failed download must never pass for the image.
      const part = new File(images, `${name}.part`);
      await File.downloadFileAsync(links[name]!, part, { idempotent: true });
      await part.move(new File(images, name), { overwrite: true });
    }
  };
  await Promise.all([worker(), worker(), worker()]);
}

export function imageUri(file: string): string {
  return new File(images, file).uri;
}
