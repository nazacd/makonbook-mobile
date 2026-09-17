import { Pressable, Text, View } from 'react-native';

import type { OptionLetter } from '@/lib/types';

import { MathText } from './MathText';

type AnswerChoiceProps = {
  letter: OptionLetter;
  text: string;
  selected: boolean;
  eliminated: boolean;
  onSelect: () => void;
  onToggleEliminate: () => void;
};

export function AnswerChoice({ letter, text, selected, eliminated, onSelect, onToggleEliminate }: AnswerChoiceProps) {
  return (
    <View
      className={`flex-row items-center gap-3 rounded-xl border p-3 ${
        selected ? 'border-brand bg-brand/10 dark:bg-brand/30' : 'border-neutral-300 dark:border-neutral-700'
      }`}>
      <Pressable onPress={onSelect} className="flex-1 flex-row items-center gap-3">
        <View
          className={`h-8 w-8 items-center justify-center rounded-full border ${
            selected ? 'border-brand bg-brand' : 'border-neutral-400 dark:border-neutral-600'
          }`}>
          <Text className={`font-semibold ${selected ? 'text-white' : 'text-black dark:text-white'}`}>{letter}</Text>
        </View>
        <View className={`flex-1 ${eliminated ? 'opacity-40' : ''}`}>
          <MathText
            text={text}
            className={`text-base text-black dark:text-white ${eliminated ? 'line-through' : ''}`}
          />
        </View>
      </Pressable>
      <Pressable onPress={onToggleEliminate} hitSlop={8} className="px-2 py-1">
        <Text className="text-xs text-neutral-500 dark:text-neutral-400">{eliminated ? 'Undo' : 'Strike'}</Text>
      </Pressable>
    </View>
  );
}
