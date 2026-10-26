import { Stack, useLocalSearchParams } from 'expo-router';
import { Users } from 'lucide-react-native';
import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { EmptyState, ErrorState, Skeleton } from '@/components/States';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import { fonts } from '@/design/typography';
import { describeError } from '@/lib/api/errors';
import { useNow } from '@/lib/clock';
import { normalCase } from '@/lib/groups';
import { relativeDay } from '@/lib/schedule';
import { useGroupVocab } from '@/lib/vocab/hooks';
import type { GroupVocabStudent } from '@/lib/vocab/types';

// A group's vocabulary: how many studied this week, then every student by
// when they last studied, with the words they've learned. Students who
// haven't started are together at the bottom.
export default function GroupVocabScreen() {
  const colors = useColors();
  const now = useNow();
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const query = useGroupVocab(id);
  const [pulling, setPulling] = useState(false);
  const students = query.data?.students ?? [];
  const started = students.filter((s) => s.last_review).sort((a, b) => b.last_review!.localeCompare(a.last_review!));
  const notStarted = students.filter((s) => !s.last_review);
  const studied = students.filter((s) => s.reviews_week > 0).length;

  return (
    <ScrollView
      className="flex-1 bg-brand"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 48 }}
      refreshControl={
        <RefreshControl
          refreshing={pulling}
          onRefresh={() => {
            setPulling(true);
            query.refetch().finally(() => setPulling(false));
          }}
          tintColor={colors.ink2}
          colors={[colors.ink]}
          progressBackgroundColor={colors.surface}
        />
      }>
      <Stack.Screen options={{ title: name ?? 'Words' }} />
      {query.isPending ? (
        <View className="gap-4">
          <Skeleton width={140} height={44} />
          {[0, 1, 2, 3].map((i) => (
            <View key={i} className="flex-row items-center gap-3">
              <Skeleton width={36} height={36} radius={18} />
              <View className="flex-1">
                <Skeleton height={18} />
              </View>
            </View>
          ))}
        </View>
      ) : query.isError ? (
        <ErrorState title="Couldn’t load the progress" message={describeError(query.error)} onRetry={() => query.refetch()} retrying={query.isFetching} />
      ) : students.length === 0 ? (
        <EmptyState icon={Users} title="No students yet" message="Students show up here once the office adds them to this group." />
      ) : (
        <>
          <View className="flex-row items-baseline gap-3" style={{ marginBottom: 16 }} accessible accessibilityLabel={`${studied} of ${students.length} studied this week`}>
            <Text style={{ fontFamily: fonts.displayBold, fontSize: 44, lineHeight: 50, color: colors.ink, fontVariant: ['tabular-nums'] }} maxFontSizeMultiplier={1.2}>
              {studied}
              <Text style={{ fontFamily: fonts.displaySemiBold, fontSize: 24, color: colors.ink3 }}> / {students.length}</Text>
            </Text>
            <Text variant="subhead" className="flex-1" style={{ color: colors.ink2 }}>
              studied this week
            </Text>
          </View>
          {started.map((s, i) => (
            <StudentRow key={s.client_id} student={s} now={now} first={i === 0} />
          ))}
          {notStarted.length > 0 && (
            <View style={{ marginTop: started.length ? 24 : 0 }}>
              <Text variant="subhead" style={{ color: colors.ink3, marginBottom: 2 }}>
                Hasn’t started
              </Text>
              {notStarted.map((s, i) => (
                <View key={s.client_id} className="flex-row items-center gap-3" style={{ minHeight: 56, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}>
                  <View style={{ opacity: 0.7 }}>
                    <Avatar kind="student" firstName={s.first_name} lastName={s.last_name} id={s.client_id} size={36} />
                  </View>
                  <Text variant="body" style={{ color: colors.ink2 }}>
                    {normalCase(`${s.first_name} ${s.last_name}`)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function StudentRow({ student: s, now, first }: { student: GroupVocabStudent; now: number; first: boolean }) {
  const colors = useColors();
  const name = normalCase(`${s.first_name} ${s.last_name}`);
  const day = relativeDay(Date.parse(s.last_review!), now);
  const line = `${day[0]!.toUpperCase()}${day.slice(1)} · ${s.reviews_week ? `${s.reviews_week} ${s.reviews_week === 1 ? 'review' : 'reviews'} this week` : 'none this week'}`;
  return (
    <View
      className="flex-row items-center gap-3"
      style={{ minHeight: 64, paddingVertical: 8, borderTopWidth: first ? 0 : 1, borderTopColor: colors.line }}
      accessible
      accessibilityLabel={`${name}, last studied ${day}, ${s.reviews_week} reviews this week, ${s.learned} words learned`}>
      <Avatar kind="student" firstName={s.first_name} lastName={s.last_name} id={s.client_id} size={36} />
      <View className="flex-1 gap-0.5">
        <Text variant="body" numberOfLines={1} style={{ color: colors.ink }}>
          {name}
        </Text>
        <Text variant="footnote" numberOfLines={1} style={{ color: colors.ink3 }}>
          {line}
        </Text>
      </View>
      <View className="items-end">
        <Text style={{ fontFamily: fonts.displayBold, fontSize: 22, lineHeight: 26, color: colors.ink, fontVariant: ['tabular-nums'] }} maxFontSizeMultiplier={1.2}>
          {s.learned}
        </Text>
        <Text variant="caption" style={{ color: colors.ink3, fontWeight: '400' }}>
          learned
        </Text>
      </View>
    </View>
  );
}
