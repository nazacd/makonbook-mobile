import { Pressable, View } from 'react-native';

import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
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

const OUTCOME_WORD: Record<QuestionOutcome, string> = { correct: 'right', incorrect: 'wrong', skipped: 'blank' };

export function QuestionNavigatorGrid(props: QuestionNavigatorGridProps) {
  return (
    <View className={props.variant === 'results' ? 'flex-row flex-wrap' : 'flex-row flex-wrap gap-3 px-1 justify-center'} style={props.variant === 'results' ? { columnGap: 11, rowGap: 10 } : undefined}>
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
        : null}
      {props.variant === 'results' ? <ResultCells items={props.items} onPress={props.onPress} /> : null}
    </View>
  );
}

// Right, wrong and blank differ by fill, not only by colour, so they read in
// grayscale too: a soft green tile, a solid terracotta one, a dashed outline.
function ResultCells({ items, onPress }: { items: ResultItem[]; onPress: (id: number) => void }) {
  const colors = useColors();
  return items.map((item) => (
    <Pressable
      key={item.id}
      onPress={() => onPress(item.id)}
      accessibilityRole="button"
      accessibilityLabel={`Question ${item.id}, ${OUTCOME_WORD[item.outcome]}`}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
        backgroundColor: item.outcome === 'correct' ? colors.goodTint : item.outcome === 'incorrect' ? colors.bad : 'transparent',
        borderWidth: item.outcome === 'skipped' ? 1.5 : 0,
        borderStyle: 'dashed',
        borderColor: colors.lineStrong,
      })}>
      <Text
        variant="subhead"
        style={{
          color: item.outcome === 'incorrect' ? colors.bg : item.outcome === 'skipped' ? colors.ink3 : colors.ink,
          fontWeight: item.outcome === 'incorrect' ? '700' : '500',
          fontVariant: ['tabular-nums'],
        }}>
        {item.id}
      </Text>
    </Pressable>
  ));
}
