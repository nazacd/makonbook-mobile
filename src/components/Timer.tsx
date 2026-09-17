import { Text, View } from 'react-native';

import { formatRemainingTime } from '@/lib/timer';

type TimerProps = {
  remainingMs: number;
};

export function Timer({ remainingMs }: TimerProps) {
  const low = remainingMs <= 5 * 60 * 1000;

  return (
    <View className="items-center border-b border-neutral-200 bg-white py-3 dark:border-neutral-800 dark:bg-black">
      <Text className={`text-2xl font-bold ${low ? 'text-red-600' : 'text-black dark:text-white'}`}>
        {formatRemainingTime(remainingMs)}
      </Text>
    </View>
  );
}
