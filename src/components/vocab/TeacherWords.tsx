import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
import { colors } from '@/design/colors';
import { useMe } from '@/lib/api/queries';
import type { Profile } from '@/lib/api/types';

// The teacher's Words tab: their groups, each opening its students'
// vocabulary progress.
export function TeacherWords() {
  const insets = useSafeAreaInsets();
  const profile = useMe().data as Profile; // the signed-in layout only renders with a profile

  return (
    <ScrollView
      className="flex-1 bg-brand"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 32 }}
      contentContainerClassName="gap-4 px-5">
      <View className="gap-1 pb-2">
        <Text variant="subhead" style={{ color: colors.secondaryText }}>
          Your students’ vocabulary
        </Text>
        <Text variant="largeTitle" className="text-white" accessibilityRole="header">
          Words
        </Text>
      </View>
      {profile.groups.length === 0 ? (
        <View className="items-center gap-2 px-4 py-16">
          <Text variant="title3" className="text-white">
            No groups yet
          </Text>
          <Text variant="subhead" style={{ color: colors.secondaryText, textAlign: 'center' }}>
            Your groups appear here once you teach one in HolliHop.
          </Text>
        </View>
      ) : (
        <View className="overflow-hidden rounded-3xl bg-surface">
          {profile.groups.map((g, i) => (
            <Pressable
              key={g.id}
              onPress={() => router.push({ pathname: '/vocab/group/[id]', params: { id: String(g.id), name: g.name } })}
              accessibilityRole="button"
              style={({ pressed }) => ({ backgroundColor: pressed ? 'rgba(255, 255, 255, 0.06)' : 'transparent' })}>
              <View className="ml-5" style={i ? { borderTopWidth: 1, borderTopColor: colors.separator } : undefined}>
                <View className="min-h-[60px] flex-row items-center gap-3 py-3 pr-5">
                  <View className="flex-1 gap-0.5">
                    <Text variant="body" className="text-white">
                      {g.name}
                    </Text>
                    <Text variant="footnote" style={{ color: colors.tertiaryText }}>
                      {[g.discipline, g.office].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <Text variant="body" style={{ color: colors.tertiaryText }}>
                    ›
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
