import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { House } from 'lucide-react-native';

import { Icon } from '@/components/Icon';
import { QuestionNavigatorGrid } from '@/components/QuestionNavigatorGrid';
import { Text } from '@/components/Text';
import { useGoHome, useHomeHref } from '@/lib/navigation';
import { useSession } from '@/lib/session-context';
import type { PlacementSubject } from '@/lib/types';

export default function ResultsScreen() {
  const { subject } = useLocalSearchParams<{ subject: PlacementSubject }>();
  const { state } = useSession();

  const home = useHomeHref();
  const goHome = useGoHome();

  // Nothing to show (opened directly, or the results were cleared).
  if (state.status !== 'submitted' || !state.results) {
    return <Redirect href={home} />;
  }

  const { level, perQuestion } = state.results;

  return (
    <View className="flex-1 bg-brand">
      <SafeAreaView style={{ flex: 1 }}>
        <View className="px-2 pt-2">
          <Pressable onPress={goHome} hitSlop={10} className="self-start p-2">
            <Icon as={House} size={20} />
          </Pressable>
        </View>
        <ScrollView className="flex-1">
          <View className="gap-6 p-6">
            <View className="items-center gap-2 rounded-2xl bg-surface p-8">
              <Text className="text-center text-sm font-semibold uppercase tracking-wide text-ink-2">
                Recommended Starting Level
              </Text>
              <Text className="text-4xl mt-0.5 font-bold text-accent">{level}</Text>
            </View>

            <View className="gap-3">
              <Text className="text-base font-semibold text-ink mb-2">Question Review</Text>
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
