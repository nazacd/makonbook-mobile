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

const MAX_DISPLAY_DENOMINATOR = 1000;

/**
 * Formats a grid-in answer key for display. Short decimals stay as-is
 * ("0.375", "1209"); repeating values are shown as their simplest fraction
 * plus a rounded decimal ("36/85 (≈ 0.4235)") instead of "0.4235294118".
 */
export function formatGridInAnswer(value: number): string {
  if (Math.abs(value - Number(value.toFixed(4))) < 1e-9) {
    return String(Number(value.toFixed(4)));
  }
  for (let denominator = 2; denominator <= MAX_DISPLAY_DENOMINATOR; denominator++) {
    const numerator = Math.round(value * denominator);
    if (Math.abs(value * denominator - numerator) < 1e-6) {
      return `${numerator}/${denominator} (≈ ${value.toFixed(4)})`;
    }
  }
  return value.toFixed(4);
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
