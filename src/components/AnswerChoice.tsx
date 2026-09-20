import { Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

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

function EliminateIcon({ size = 16, color = '#ffffff80' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4l16 16M20 4 4 20"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function UndoIcon({ size = 16, color = '#ffffff80' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 9H4V4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4.5 13a8 8 0 1 0 2.3-6.5L4 9"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function AnswerChoice({ letter, text, selected, eliminated, onSelect, onToggleEliminate }: AnswerChoiceProps) {
  return (
    <View
      className={`relative flex-row items-center gap-3 rounded-xl border p-3 ${
        selected ? 'border-accent bg-accent/10' : 'border-white/10 bg-surface'
      }`}>
      <Pressable
        onPress={onSelect}
        disabled={eliminated}
        className={`flex-1 flex-row items-center gap-3 ${eliminated ? 'opacity-40' : ''}`}>
        <View
          className={`h-8 w-8 items-center justify-center rounded-full border ${
            selected ? 'border-accent bg-accent' : 'border-white/20'
          }`}>
          <MathText text={letter} className="font-semibold text-white" />
        </View>
        <View className="flex-1">
          <MathText text={text} className="text-base text-white" />
        </View>
      </Pressable>
      {eliminated ? (
        <View pointerEvents="none" className="absolute inset-0 items-stretch justify-center">
          <View className="h-0.5 bg-white/50" />
        </View>
      ) : null}
      <Pressable onPress={onToggleEliminate} hitSlop={8} className="px-2 py-1">
        {eliminated ? (
          <View className="rounded-full bg-surface p-1.5">
            <UndoIcon />
          </View>
        ) : (
          <EliminateIcon />
        )}
      </Pressable>
    </View>
  );
}
