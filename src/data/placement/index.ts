import englishData from './english.json';
import mathData from './math.json';

import type { PlacementSubject, Question } from '@/lib/types';

export function getPlacementQuestions(subject: PlacementSubject): Question[] {
  return (subject === 'math' ? mathData.math : englishData.english) as Question[];
}
