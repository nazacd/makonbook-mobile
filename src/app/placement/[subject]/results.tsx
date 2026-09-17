import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QuestionNavigatorGrid } from '@/components/QuestionNavigatorGrid';
import { useSession } from '@/lib/session-context';
import type { PlacementSubject } from '@/lib/types';

export default function ResultsScreen() {
  const { subject } = useLocalSearchParams<{ subject: PlacementSubject }>();
  const { state } = useSession();

  useEffect(() => {
    if (state.status !== 'submitted' || !state.results) {
      router.replace('/');
    }
  }, [state.status, state.results]);

  if (state.status !== 'submitted' || !state.results) {
    return <View className="flex-1 bg-brand" />;
  }

  const { level, perQuestion } = state.results;

  return (
    <View className="flex-1 bg-brand">
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView className="flex-1">
          <View className="gap-6 p-6">
            <View className="items-center gap-2 rounded-2xl bg-surface p-8">
              <Text className="text-center text-sm font-semibold uppercase tracking-wide text-white/60">
                Recommended Starting Level
              </Text>
              <Text className="text-4xl font-bold text-white">{level}</Text>
            </View>

            <View className="gap-3">
              <Text className="text-base font-semibold text-white">Question Review</Text>
              <QuestionNavigatorGrid
                variant="results"
                items={state.questions.map((q) => ({ id: q.id, outcome: perQuestion[q.id] }))}
                onPress={(id) =>
                  router.push({
                    pathname: '/placement/[subject]/review/[questionId]',
                    params: { subject, questionId: String(id) },
                  })
                }
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
