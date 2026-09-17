import type { Question } from './types';

export const GRID_IN_EPSILON = 0.001;

/**
 * Parses grid-in student input as either a decimal ("0.5", ".5") or a
 * fraction ("1/2"). Returns null when the input can't be parsed as a number.
 */
export function parseGridInInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const fractionMatch = /^-?\d+\/\d+$/.exec(trimmed);
  if (fractionMatch) {
    const [numerator, denominator] = trimmed.split('/').map(Number);
    return denominator === 0 ? null : numerator / denominator;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isAnswerCorrect(question: Question, raw: string | number | undefined): boolean {
  if (raw == null || raw === '') return false;

  if (question.options) {
    return raw === question.correct;
  }

  const parsed = typeof raw === 'number' ? raw : parseGridInInput(String(raw));
  if (parsed == null) return false;

  return Math.abs(parsed - Number(question.correct)) < GRID_IN_EPSILON;
}
