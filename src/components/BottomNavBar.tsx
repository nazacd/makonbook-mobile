import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

type BottomNavBarProps = {
  onBack?: () => void;
  onNext?: () => void;
  backLabel?: string;
  nextLabel?: string;
  backDisabled?: boolean;
  nextDisabled?: boolean;
  centerSlot?: ReactNode;
};

export function BottomNavBar({
  onBack,
  onNext,
  backLabel = 'Back',
  nextLabel = 'Next',
  backDisabled,
  nextDisabled,
  centerSlot,
}: BottomNavBarProps) {
  const backInactive = backDisabled || !onBack;
  const nextInactive = nextDisabled || !onNext;

  return (
    <View className="flex-row items-center justify-between border-t border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-black">
      <Pressable
        onPress={onBack}
        disabled={backInactive}
        className={`rounded-lg px-4 py-2 ${backInactive ? 'opacity-30' : ''}`}>
        <Text className="text-base font-medium text-black dark:text-white">{backLabel}</Text>
      </Pressable>

      {centerSlot}

      <Pressable
        onPress={onNext}
        disabled={nextInactive}
        className={`rounded-lg bg-brand px-4 py-2 ${nextInactive ? 'opacity-30' : ''}`}>
        <Text className="text-base font-medium text-white">{nextLabel}</Text>
      </Pressable>
    </View>
  );
}
