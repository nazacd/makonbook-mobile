import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { PlacementSubject } from '@/lib/types';

const SUBJECTS: { subject: PlacementSubject; label: string }[] = [
  { subject: 'math', label: 'Math' },
  { subject: 'english', label: 'English' },
];

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-brand">
      <SafeAreaView style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <Text className="mb-2 text-3xl font-bold text-white">SAT MAKON</Text>
          <Text className="mb-6 text-base text-white/60">Level Check</Text>

          {SUBJECTS.map(({ subject, label }) => (
            <Pressable
              key={subject}
              onPress={() =>
                router.push({ pathname: '/placement/[subject]/instructions', params: { subject } })
              }
              className="w-full max-w-sm items-center rounded-2xl bg-surface py-8">
              <Text className="text-2xl font-semibold text-white">{label}</Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}
