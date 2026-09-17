export type PlacementSubject = 'math' | 'english';

export type QuestionLevel = 'easy' | 'medium' | 'hard';

export type DisplayLevel = 'Foundation' | 'Pre-SAT' | 'Advanced';

export type OptionLetter = 'A' | 'B' | 'C' | 'D';

export interface Question {
  id: number;
  level: QuestionLevel;
  question: string;
  content: {
    text: string | null;
    image: string | null;
  };
  options: Record<OptionLetter, string> | null;
  correct: string | number;
  explanation: string;
}

export type SessionAnswers = Record<number, string | number>;

export type EliminatedMap = Record<number, OptionLetter[]>;

export type QuestionOutcome = 'correct' | 'incorrect' | 'skipped';

export interface PlacementResults {
  level: DisplayLevel;
  perQuestion: Record<number, QuestionOutcome>;
}

export interface StoredProgress {
  startTimestamp: number;
  currentIndex: number;
  answers: SessionAnswers;
  marked: number[];
  eliminated: EliminatedMap;
}
