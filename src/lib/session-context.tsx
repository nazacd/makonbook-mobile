import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';

import { getPlacementQuestions } from '@/data/placement';

import { clearProgress, saveProgress } from './storage';
import { computeResults } from './scoring';
import type {
  EliminatedMap,
  OptionLetter,
  PlacementResults,
  PlacementSubject,
  Question,
  SessionAnswers,
  StoredProgress,
} from './types';

type SessionStatus = 'not-started' | 'in-progress' | 'submitted';

interface SessionState {
  subject: PlacementSubject;
  questions: Question[];
  status: SessionStatus;
  startTimestamp: number | null;
  currentIndex: number;
  answers: SessionAnswers;
  marked: number[];
  eliminated: EliminatedMap;
  results: PlacementResults | null;
}

type Action =
  | { type: 'RESTORE'; payload: StoredProgress }
  | { type: 'BEGIN' }
  | { type: 'SET_ANSWER'; questionId: number; value: string | number }
  | { type: 'TOGGLE_MARK'; questionId: number }
  | { type: 'TOGGLE_ELIMINATED'; questionId: number; letter: OptionLetter }
  | { type: 'GOTO'; index: number }
  | { type: 'SUBMIT' }
  | { type: 'RESET' }
  | { type: 'SHIFT_START'; deltaMs: number };

function sessionReducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'RESTORE':
      return {
        ...state,
        status: 'in-progress',
        startTimestamp: action.payload.startTimestamp,
        currentIndex: action.payload.currentIndex,
        answers: action.payload.answers,
        marked: action.payload.marked,
        eliminated: action.payload.eliminated,
      };
    case 'BEGIN':
      return {
        ...state,
        status: 'in-progress',
        startTimestamp: Date.now(),
        currentIndex: 0,
        answers: {},
        marked: [],
        eliminated: {},
        results: null,
      };
    case 'SET_ANSWER':
      return { ...state, answers: { ...state.answers, [action.questionId]: action.value } };
    case 'TOGGLE_MARK': {
      const marked = state.marked.includes(action.questionId)
        ? state.marked.filter((id) => id !== action.questionId)
        : [...state.marked, action.questionId];
      return { ...state, marked };
    }
    case 'TOGGLE_ELIMINATED': {
      const current = state.eliminated[action.questionId] ?? [];
      const next = current.includes(action.letter)
        ? current.filter((letter) => letter !== action.letter)
        : [...current, action.letter];
      return { ...state, eliminated: { ...state.eliminated, [action.questionId]: next } };
    }
    case 'GOTO':
      return {
        ...state,
        currentIndex: Math.max(0, Math.min(state.questions.length - 1, action.index)),
      };
    case 'SUBMIT':
      return { ...state, status: 'submitted', results: computeResults(state.questions, state.answers) };
    case 'SHIFT_START':
      return state.startTimestamp == null
        ? state
        : { ...state, startTimestamp: state.startTimestamp + action.deltaMs };
    case 'RESET':
      return {
        ...state,
        status: 'not-started',
        startTimestamp: null,
        currentIndex: 0,
        answers: {},
        marked: [],
        eliminated: {},
        results: null,
      };
    default:
      return state;
  }
}

interface SessionContextValue {
  state: SessionState;
  beginTest: () => void;
  restoreTest: (progress: StoredProgress) => void;
  setAnswer: (questionId: number, value: string | number) => void;
  toggleMark: (questionId: number) => void;
  toggleEliminated: (questionId: number, letter: OptionLetter) => void;
  goto: (index: number) => void;
  submitTest: () => Promise<void>;
  resetTest: () => void;
  shiftStart: (deltaMs: number) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({
  subject,
  children,
}: {
  subject: PlacementSubject;
  children: ReactNode;
}) {
  const questions = useMemo(() => getPlacementQuestions(subject), [subject]);
  const [state, dispatch] = useReducer(sessionReducer, {
    subject,
    questions,
    status: 'not-started',
    startTimestamp: null,
    currentIndex: 0,
    answers: {},
    marked: [],
    eliminated: {},
    results: null,
  });

  useEffect(() => {
    if (state.status !== 'in-progress' || state.startTimestamp == null) return;
    saveProgress(subject, {
      startTimestamp: state.startTimestamp,
      currentIndex: state.currentIndex,
      answers: state.answers,
      marked: state.marked,
      eliminated: state.eliminated,
    });
  }, [subject, state.status, state.startTimestamp, state.currentIndex, state.answers, state.marked, state.eliminated]);

  const value = useMemo<SessionContextValue>(
    () => ({
      state,
      beginTest: () => dispatch({ type: 'BEGIN' }),
      restoreTest: (payload) => dispatch({ type: 'RESTORE', payload }),
      setAnswer: (questionId, value) => dispatch({ type: 'SET_ANSWER', questionId, value }),
      toggleMark: (questionId) => dispatch({ type: 'TOGGLE_MARK', questionId }),
      toggleEliminated: (questionId, letter) => dispatch({ type: 'TOGGLE_ELIMINATED', questionId, letter }),
      goto: (index) => dispatch({ type: 'GOTO', index }),
      submitTest: async () => {
        dispatch({ type: 'SUBMIT' });
        await clearProgress(subject);
      },
      resetTest: () => dispatch({ type: 'RESET' }),
      shiftStart: (deltaMs) => dispatch({ type: 'SHIFT_START', deltaMs }),
    }),
    [state, subject]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}
