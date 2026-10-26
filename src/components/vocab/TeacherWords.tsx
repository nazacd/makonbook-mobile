import { router } from 'expo-router';
import { Users } from 'lucide-react-native';
import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/States';
import { groupTitle, TeacherGroupRow } from '@/components/TeacherGroupRow';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import { useMe } from '@/lib/api/queries';
import type { Profile } from '@/lib/api/types';
import { useVocabSummary } from '@/lib/vocab/summary';

// The teacher's Words tab: each group with how many of its students studied
// words this week, each opening the group's progress.
export function TeacherWords() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const profile = useMe().data as Profile; // the signed-in layout only renders with a profile
  const summary = useVocabSummary(profile.groups.map((g) => g.id));
  const [pulling, setPulling] = useState(false);

  return (
    <ScrollView
      className="flex-1 bg-brand"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32, paddingHorizontal: 20 }}
      refreshControl={
        <RefreshControl
          refreshing={pulling}
          onRefresh={() => {
            setPulling(true);
            summary.refetch().finally(() => setPulling(false));
          }}
          tintColor={colors.ink2}
          colors={[colors.ink]}
          progressBackgroundColor={colors.surface}
        />
      }>
      {profile.groups.length === 0 ? (
        <EmptyState icon={Users} title="No groups yet" message="Your groups appear here once you teach one in HolliHop." />
      ) : (
        profile.groups.map((g, i) => {
          const s = summary.groups[g.id];
          return (
            <TeacherGroupRow
              key={g.id}
              group={g}
              first={i === 0}
              onPress={() => router.push({ pathname: '/vocab/group/[id]', params: { id: String(g.id), name: groupTitle(g) } })}
              details={s && s.studied > 0 && `${s.studied} of ${s.students} studied this week`}
              right={
                s &&
                s.studied > 0 && (
                  <View className="items-end">
                    <Text variant="subhead" style={{ color: colors.ink, fontWeight: '600', fontVariant: ['tabular-nums'] }}>
                      {s.studied}/{s.students}
                    </Text>
                    <Text variant="footnote" style={{ color: colors.ink3 }}>
                      this week
                    </Text>
                  </View>
                )
              }
            />
          );
        })
      )}
    </ScrollView>
  );
}
