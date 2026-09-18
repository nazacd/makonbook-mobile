import { Pressable, Text, View } from 'react-native';

import type { QuestionOutcome } from '@/lib/types';

type ProgressItem = { id: number; current: boolean; answered: boolean; marked: boolean };
type ResultItem = { id: number; outcome: QuestionOutcome };

type QuestionNavigatorGridProps =
  | { variant: 'progress'; items: ProgressItem[]; onPress: (id: number) => void }
  | { variant: 'results'; items: ResultItem[]; onPress: (id: number) => void };

function progressCellClassName(item: ProgressItem): string {
  if (item.current) return 'bg-accent border-accent';
  if (item.answered) return 'bg-emerald-500/20 border-emerald-500';
  return 'bg-surface border-white/10';
}

function resultCellClassName(outcome: QuestionOutcome): string {
  switch (outcome) {
    case 'correct':
      return 'bg-emerald-500/20 border-emerald-500';
    case 'incorrect':
      return 'bg-red-500/20 border-red-500';
    case 'skipped':
      return 'bg-surface border-white/10';
  }
}

export function QuestionNavigatorGrid(props: QuestionNavigatorGridProps) {
  return (
    <View className="flex-row flex-wrap gap-3 px-1 justify-center">
      {props.variant === 'progress'
        ? props.items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => props.onPress(item.id)}
              className={`h-11 w-11 items-center justify-center rounded-lg border ${progressCellClassName(item)}`}>
              <Text className="text-sm font-semibold text-white">{item.id}</Text>
              {item.marked ? <View className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-400" /> : null}
            </Pressable>
          ))
        : props.items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => props.onPress(item.id)}
              className={`h-11 w-11 mx-2 items-center justify-center rounded-lg border ${resultCellClassName(item.outcome)}`}>
              <Text className="text-sm font-semibold text-white">{item.id}</Text>
            </Pressable>
          ))}
    </View>
  );
}
