import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '@/lib/session-context';
import { loadProgress } from '@/lib/storage';
import type { PlacementSubject } from '@/lib/types';

const SUBJECT_LABEL: Record<PlacementSubject, string> = {
  math: 'Math',
  english: 'English',
};

export default function InstructionsScreen() {
  const { subject } = useLocalSearchParams<{ subject: PlacementSubject }>();
  const { beginTest, restoreTest } = useSession();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadProgress(subject).then((progress) => {
      if (cancelled) return;
      if (progress) {
        restoreTest(progress);
        router.replace({ pathname: '/placement/[subject]/test', params: { subject } });
      } else {
        setChecking(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [subject, restoreTest]);

  if (checking) {
    return <View className="flex-1 bg-brand" />;
  }

  return (
    <View className="flex-1 bg-brand">
      <SafeAreaView className="flex-1 justify-between px-6 py-8">
        <View className="gap-4">
          <Text className="text-sm font-semibold uppercase tracking-wide text-white/70">
            {SUBJECT_LABEL[subject]} Level Check
          </Text>
          <Text className="text-3xl font-bold text-white">Before you begin</Text>
          <View className="gap-3 rounded-2xl bg-white/10 p-5">
            <Text className="text-base text-white">50 questions</Text>
            <Text className="text-base text-white">60 minutes</Text>
            <Text className="text-base text-white">One attempt — answer to the best of your ability</Text>
          </View>
        </View>

        <Pressable
          onPress={() => {
            beginTest();
            router.replace({ pathname: '/placement/[subject]/test', params: { subject } });
          }}
          className="items-center rounded-xl bg-white py-4">
          <Text className="text-lg font-semibold text-brand">Begin</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}
