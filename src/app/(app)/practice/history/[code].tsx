import { router, Stack, useLocalSearchParams } from 'expo-router';
import { History } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';

import { EmptyState } from '@/components/States';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import { fonts } from '@/design/typography';
import { useNow } from '@/lib/clock';
import { useLocalAttempts } from '@/lib/practice/hooks';
import { SUBJECT_LABEL, testName } from '@/lib/practice/run';
import { relativeDay } from '@/lib/schedule';

// Every attempt of one test on this phone, newest first; each opens its result.
export default function PracticeHistoryScreen() {
  const colors = useColors();
  const now = useNow();
  const { code } = useLocalSearchParams<{ code: string }>();
  const mine = (useLocalAttempts().data ?? []).filter((a) => a.code === code);
  const title = mine[0] ? testName(mine[0].title) : 'History';

  return (
    <ScrollView className="flex-1 bg-brand" contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 }}>
      <Stack.Screen options={{ title }} />
      {mine.length === 0 ? (
        <EmptyState icon={History} title="No attempts yet" message="Your results for this test show up here." />
      ) : (
        mine.map((a, i) => {
          const full = a.total != null;
          const subject = a.sections[0]!;
          const what = full ? 'Full test' : SUBJECT_LABEL[subject];
          const when = relativeDay(Date.parse(a.finished_at), now);
          const score = String((full ? a.total : a.scores[subject]?.score) ?? '–');
          return (
            <Pressable
              key={a.id}
              onPress={() => router.push({ pathname: '/practice/result/[id]', params: { id: a.id } })}
              accessibilityRole="button"
              accessibilityLabel={`${what}, ${when}, ${score}`}
              style={({ pressed }) => ({ marginHorizontal: -20, paddingHorizontal: 20, backgroundColor: pressed ? colors.surface2 : 'transparent' })}>
              <View className="flex-row items-center gap-3" style={{ minHeight: 64, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}>
                <View className="flex-1 gap-0.5">
                  <Text variant="body" style={{ color: colors.ink }}>
                    {what}
                  </Text>
                  <Text variant="footnote" style={{ color: colors.ink3 }}>
                    {when}
                  </Text>
                </View>
                {full ? (
                  <Text style={{ fontFamily: fonts.displayBold, fontSize: 22, color: colors.ink, fontVariant: ['tabular-nums'] }} maxFontSizeMultiplier={1.2}>
                    {score}
                  </Text>
                ) : (
                  <Text variant="subhead" style={{ color: colors.ink2, fontVariant: ['tabular-nums'] }}>
                    {score}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}
