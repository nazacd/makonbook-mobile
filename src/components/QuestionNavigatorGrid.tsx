import { Pressable, View } from 'react-native';

import { Text } from '@/components/Text';
import type { QuestionOutcome } from '@/lib/types';

type ProgressItem = { id: number; current: boolean; answered: boolean; marked: boolean };
type ResultItem = { id: number; outcome: QuestionOutcome };

type QuestionNavigatorGridProps =
  | { variant: 'progress'; items: ProgressItem[]; onPress: (id: number) => void }
  | { variant: 'results'; items: ResultItem[]; onPress: (id: number) => void };

function progressCellClassName(item: ProgressItem): string {
  if (item.current) return 'bg-primary border-primary';
  if (item.answered) return 'bg-good-tint border-good';
  return 'bg-surface border-line';
}

function resultCellClassName(outcome: QuestionOutcome): string {
  switch (outcome) {
    case 'correct':
      return 'bg-good-tint border-good';
    case 'incorrect':
      return 'bg-bad-tint border-bad';
    case 'skipped':
      return 'bg-surface border-line';
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
              <Text className={`text-sm font-semibold ${item.current ? 'text-on-primary' : 'text-ink'}`}>{item.id}</Text>
              {item.marked ? <View className="absolute right-1 top-1 h-2 w-2 rounded-full bg-fill-watch" /> : null}
            </Pressable>
          ))
        : props.items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => props.onPress(item.id)}
              className={`h-11 w-11 mx-2 items-center justify-center rounded-lg border ${resultCellClassName(item.outcome)}`}>
              <Text className="text-sm font-semibold text-ink">{item.id}</Text>
            </Pressable>
          ))}
    </View>
  );
}
