import { isAnswerCorrect } from './gradeAnswer';
import type { DisplayLevel, PlacementResults, Question, QuestionLevel, QuestionOutcome, SessionAnswers } from './types';

/**
 * Per-tier mastery thresholds for the staircase level-estimation algorithm.
 * The bar drops as difficulty rises. Kept in one named constant so they're
 * trivial to retune against real placement outcomes.
 */
export const MASTERY_THRESHOLDS: Record<QuestionLevel, number> = {
  easy: 0.75,
  medium: 0.6,
  hard: 0.4,
};

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
 * Advanced also requires some evidence on `hard`, not just `easy`/`medium`.
 */
export function estimateLevel(pct: Record<QuestionLevel, number>): DisplayLevel {
  if (pct.easy < MASTERY_THRESHOLDS.easy) return 'Foundation';
  if (pct.medium < MASTERY_THRESHOLDS.medium) return 'Pre-SAT';
  if (pct.hard < MASTERY_THRESHOLDS.hard) return 'Pre-SAT';
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
