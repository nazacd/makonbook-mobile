import { Text, View } from 'react-native';

import { formatRemainingTime } from '@/lib/timer';

type TimerProps = {
  remainingMs: number;
};

export function Timer({ remainingMs }: TimerProps) {
  const low = remainingMs <= 5 * 60 * 1000;

  return (
    <View className="items-center py-3">
      <Text className={`text-2xl font-bold ${low ? 'text-red-400' : 'text-white'}`}>
        {formatRemainingTime(remainingMs)}
      </Text>
    </View>
  );
}
