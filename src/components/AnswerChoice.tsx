import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Undo2, X } from 'lucide-react-native';

import { Icon } from '@/components/Icon';
import { useColors } from '@/design/colors';
import type { OptionLetter } from '@/lib/types';

import { MathText } from './MathText';
import { PressableScale } from './PressableScale';

type AnswerChoiceProps = {
  letter: OptionLetter;
  text: string;
  /** Drawn instead of `text` (practice tests' rich content). */
  content?: ReactNode;
  selected: boolean;
  eliminated: boolean;
  onSelect: () => void;
  onToggleEliminate: () => void;
};

// The whole card selects the choice (not only its text); the strike-out
// button on the right is its own target.
export function AnswerChoice({ letter, text, content, selected, eliminated, onSelect, onToggleEliminate }: AnswerChoiceProps) {
  const colors = useColors();
  return (
    // Not `disabled` while struck out: that would disable the undo button
    // inside it too. The card just ignores taps then.
    <PressableScale
      onPress={eliminated ? undefined : onSelect}
      pressedScale={eliminated ? 1 : 0.98}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={eliminated ? `Choice ${letter}, struck out` : `Choice ${letter}`}
      className={`relative flex-row items-center gap-3 rounded-xl border p-3 ${
        selected ? 'border-accent bg-accent-tint' : 'border-line bg-surface'
      }`}>
      <View className={`flex-1 flex-row items-center gap-3 ${eliminated ? 'opacity-40' : ''}`}>
        <View
          className={`h-8 w-8 items-center justify-center rounded-full border ${
            selected ? 'border-accent bg-accent' : 'border-line-strong'
          }`}>
          <MathText text={letter} className={`font-semibold ${selected ? 'text-on-accent' : 'text-ink'}`} />
        </View>
        <View className="flex-1">
          {content ?? <MathText text={text} className="text-base text-ink" />}
        </View>
      </View>
      {eliminated ? (
        <View pointerEvents="none" className="absolute inset-0 items-stretch justify-center">
          <View className="h-0.5 bg-ink-3" />
        </View>
      ) : null}
      <Pressable
        onPress={onToggleEliminate}
        hitSlop={8}
        className="px-2 py-1"
        accessibilityRole="button"
        accessibilityLabel={eliminated ? `Bring back choice ${letter}` : `Strike out choice ${letter}`}>
        {eliminated ? (
          <View className="rounded-full bg-surface p-1.5">
            <Icon as={Undo2} size={16} color={colors.ink3} />
          </View>
        ) : (
          <Icon as={X} size={16} color={colors.ink3} />
        )}
      </Pressable>
    </PressableScale>
  );
}
