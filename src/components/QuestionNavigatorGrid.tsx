import { Pressable, Text, View } from 'react-native';

import type { QuestionOutcome } from '@/lib/types';

type ProgressItem = { id: number; current: boolean; answered: boolean; marked: boolean };
type ResultItem = { id: number; outcome: QuestionOutcome };

type QuestionNavigatorGridProps =
  | { variant: 'progress'; items: ProgressItem[]; onPress: (id: number) => void }
  | { variant: 'results'; items: ResultItem[]; onPress: (id: number) => void };

function progressCellClassName(item: ProgressItem): string {
  if (item.current) return 'bg-brand border-brand';
  if (item.answered) return 'bg-emerald-100 border-emerald-400 dark:bg-emerald-900 dark:border-emerald-600';
  return 'bg-neutral-100 border-neutral-300 dark:bg-neutral-900 dark:border-neutral-700';
}

function progressTextClassName(item: ProgressItem): string {
  return item.current ? 'text-white' : 'text-black dark:text-white';
}

function resultCellClassName(outcome: QuestionOutcome): string {
  switch (outcome) {
    case 'correct':
      return 'bg-emerald-100 border-emerald-400 dark:bg-emerald-900 dark:border-emerald-600';
    case 'incorrect':
      return 'bg-red-100 border-red-400 dark:bg-red-900 dark:border-red-600';
    case 'skipped':
      return 'bg-neutral-100 border-neutral-300 dark:bg-neutral-900 dark:border-neutral-700';
  }
}

export function QuestionNavigatorGrid(props: QuestionNavigatorGridProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {props.variant === 'progress'
        ? props.items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => props.onPress(item.id)}
              className={`h-11 w-11 items-center justify-center rounded-lg border ${progressCellClassName(item)}`}>
              <Text className={`text-sm font-semibold ${progressTextClassName(item)}`}>{item.id}</Text>
              {item.marked ? <View className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-500" /> : null}
            </Pressable>
          ))
        : props.items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => props.onPress(item.id)}
              className={`h-11 w-11 items-center justify-center rounded-lg border ${resultCellClassName(item.outcome)}`}>
              <Text className="text-sm font-semibold text-black dark:text-white">{item.id}</Text>
            </Pressable>
          ))}
    </View>
  );
}
