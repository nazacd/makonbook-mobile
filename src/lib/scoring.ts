import { isAnswerCorrect } from './gradeAnswer';
import type { DisplayLevel, PlacementResults, Question, QuestionLevel, QuestionOutcome, SessionAnswers } from './types';

/** Mastery threshold for the staircase level-estimation algorithm. Single named constant so it's trivial to retune. */
export const MASTERY_THRESHOLD = 0.75;

export function computeTierPercentages(
  questions: Question[],
  answers: SessionAnswers
): Record<QuestionLevel, number> {
  const totals: Record<QuestionLevel, { correct: number; total: number }> = {
    easy: { correct: 0, total: 0 },
    medium: { correct: 0, total: 0 },
    hard: { correct: 0, total: 0 },
  };

  for (const question of questions) {
    const tier = totals[question.level];
    tier.total += 1;
    if (isAnswerCorrect(question, answers[question.id])) {
      tier.correct += 1;
    }
  }

  return {
    easy: totals.easy.total === 0 ? 0 : totals.easy.correct / totals.easy.total,
    medium: totals.medium.total === 0 ? 0 : totals.medium.correct / totals.medium.total,
    hard: totals.hard.total === 0 ? 0 : totals.hard.correct / totals.hard.total,
  };
}

/**
 * Staircase / mastery-threshold placement. Deliberately biased toward
 * fundamentals: a student shaky on `easy` but strong on `hard` still lands
 * at Foundation. Not a bug — see spec's "Level-estimation algorithm" section.
 */
export function estimateLevel(pct: Record<QuestionLevel, number>): DisplayLevel {
  if (pct.easy < MASTERY_THRESHOLD) return 'Foundation';
  if (pct.medium < MASTERY_THRESHOLD) return 'Pre-SAT';
  return 'Advanced';
}

export function computeResults(questions: Question[], answers: SessionAnswers): PlacementResults {
  const pct = computeTierPercentages(questions, answers);
  const level = estimateLevel(pct);

  const perQuestion: Record<number, QuestionOutcome> = {};
  for (const question of questions) {
    const raw = answers[question.id];
    if (raw == null || raw === '') {
      perQuestion[question.id] = 'skipped';
    } else {
      perQuestion[question.id] = isAnswerCorrect(question, raw) ? 'correct' : 'incorrect';
    }
  }

  return { level, perQuestion };
}
