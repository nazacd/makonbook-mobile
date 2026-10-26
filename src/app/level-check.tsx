import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import type { PlacementSubject } from '@/lib/types';

const SUBJECTS: { subject: PlacementSubject; label: string; detail: string }[] = [
  { subject: 'math', label: 'Math', detail: '50 questions · 60 minutes · built-in calculator' },
  { subject: 'english', label: 'English', detail: '50 questions · 60 minutes' },
];

export default function LevelCheckScreen() {
  const colors = useColors();
  return (
    <ScrollView
      className="flex-1 bg-brand"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-4 px-5 pb-10 pt-4">
      <Text variant="body" style={{ color: colors.ink2 }}>
        Choose a subject. The test recommends a starting class; nothing is saved or sent anywhere.
      </Text>

      {SUBJECTS.map(({ subject, label, detail }) => (
        <PressableScale
          key={subject}
          onPress={() =>
            router.push({ pathname: '/placement/[subject]/instructions', params: { subject } })
          }
          className="gap-1 rounded-3xl bg-surface px-6 py-7"
          accessibilityRole="button"
          accessibilityLabel={`${label} Level Check`}
          accessibilityHint={detail}>
          <View className="flex-row items-center justify-between">
            <Text variant="title2" className="text-ink">
              {label}
            </Text>
            <Icon as={ChevronRight} size={18} color={colors.accent} />
          </View>
          <Text variant="subhead" style={{ color: colors.ink2 }}>
            {detail}
          </Text>
        </PressableScale>
      ))}
    </ScrollView>
  );
}
