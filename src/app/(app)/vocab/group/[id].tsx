import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, View } from 'react-native';

import { Notice } from '@/components/Notice';
import { Text } from '@/components/Text';
import { colors } from '@/design/colors';
import { describeError } from '@/lib/api/errors';
import { useGroupVocab } from '@/lib/vocab/hooks';

// A group's students and their vocabulary: words started and learned, and
// how much they studied this week.
export default function GroupVocabScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const query = useGroupVocab(id);
  const students = query.data?.students ?? [];
  const active = students.filter((s) => s.reviews_week > 0).length;

  return (
    <ScrollView
      className="flex-1 bg-brand"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-4 px-5 pb-12 pt-4"
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching}
          onRefresh={() => query.refetch()}
          tintColor={colors.accent}
          colors={[colors.accent]}
          progressBackgroundColor={colors.surface}
        />
      }>
      <Stack.Screen options={{ title: name ?? 'Words' }} />
      {query.isPending ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 48 }} />
      ) : query.isError ? (
        <Notice tone="error" title="Couldn’t load the progress" message={describeError(query.error)} />
      ) : students.length === 0 ? (
        <Notice tone="info" message="No students in this group right now." />
      ) : (
        <>
          <Text variant="subhead" style={{ color: colors.secondaryText }}>
            {active} of {students.length} students studied words this week. Learned: the next review is three weeks or
            more away. {query.data!.words} words in all.
          </Text>
          <View className="overflow-hidden rounded-3xl bg-surface">
            {students.map((s, i) => (
              <View
                key={s.client_id}
                className="min-h-[60px] flex-row items-center gap-3 px-5 py-3"
                style={i ? { borderTopWidth: 1, borderTopColor: colors.separator } : undefined}>
                <View className="flex-1 gap-0.5">
                  <Text variant="body" className="text-white">
                    {s.last_name} {s.first_name}
                  </Text>
                  <Text variant="footnote" style={{ color: colors.tertiaryText }}>
                    {s.last_review
                      ? `${s.started} started · ${s.reviews_week} reviews this week · last ${new Date(s.last_review).toLocaleDateString()}`
                      : 'Hasn’t started'}
                  </Text>
                </View>
                <View className="items-end">
                  <Text variant="headline" style={{ color: colors.accent, fontVariant: ['tabular-nums'] }}>
                    {s.learned}
                  </Text>
                  <Text variant="caption" style={{ color: colors.tertiaryText }}>
                    learned
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}
