import { router } from 'expo-router';
import { ChevronRight, Clock, ListOrdered, ShieldCheck } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { PlacementObjects } from '@/components/PlacementObjects';
import { PressableScale } from '@/components/PressableScale';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import { fonts } from '@/design/typography';
import type { PlacementSubject } from '@/lib/types';

const SUBJECTS: { subject: PlacementSubject; label: string; detail: string }[] = [
  { subject: 'math', label: 'Math', detail: '50 questions · 60 minutes · built-in calculator' },
  { subject: 'english', label: 'English', detail: '50 questions · 60 minutes' },
];

// Two subject blocks in their colours (as the halves of a practice test), each
// with its objects thrown in from the right; the privacy line at the bottom.
export default function LevelCheckScreen() {
  const colors = useColors();
  return (
    <ScrollView
      className="flex-1 bg-brand"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ flexGrow: 1, gap: 14, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 }}>
      <Text variant="body" style={{ color: colors.ink2, marginBottom: 4 }}>
        Choose a subject. The test recommends a starting class.
      </Text>

      {SUBJECTS.map(({ subject, label, detail }, i) => (
        <SubjectCard
          key={subject}
          subject={subject}
          label={label}
          detail={detail}
          delay={280 + i * 120}
          onPress={() => router.push({ pathname: '/placement/[subject]/instructions', params: { subject } })}
        />
      ))}

      <View className="flex-row items-center gap-2" style={{ marginTop: 'auto', paddingTop: 20 }}>
        <Icon as={ShieldCheck} size={16} color={colors.ink3} />
        <Text variant="footnote" className="flex-1" style={{ color: colors.ink3 }}>
          Nothing is saved or sent anywhere.
        </Text>
      </View>
    </ScrollView>
  );
}

function SubjectCard({ subject, label, detail, delay, onPress }: { subject: PlacementSubject; label: string; detail: string; delay: number; onPress: () => void }) {
  const colors = useColors();
  // English sits on its deeper tone, so the small text on it passes AA in both themes.
  const background = subject === 'math' ? colors.math : colors.english2;
  const ink = colors.bg;
  return (
    <PressableScale
      onPress={onPress}
      style={{ minHeight: 170, borderRadius: 20, overflow: 'hidden', backgroundColor: background }}
      className="flex-1 justify-end"
      accessibilityRole="button"
      accessibilityLabel={`${label} Level Check`}
      accessibilityHint={detail}>
      <PlacementObjects subject={subject} color={ink} delay={delay} />
      <View className="flex-row items-end gap-3" style={{ paddingTop: 76, paddingHorizontal: 20, paddingBottom: 20 }}>
        <View className="flex-1">
          <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: fonts.displayBold, fontSize: 30, lineHeight: 36, color: ink }}>
            {label}
          </Text>
          <View className="flex-row flex-wrap items-center" style={{ columnGap: 14, rowGap: 2, marginTop: 4 }}>
            <View className="flex-row items-center gap-1.5">
              <Icon as={ListOrdered} size={15} color={ink} />
              <Text variant="subhead" style={{ color: ink }}>
                50 questions
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Icon as={Clock} size={15} color={ink} />
              <Text variant="subhead" style={{ color: ink, fontVariant: ['tabular-nums'] }}>
                60 min
              </Text>
            </View>
          </View>
        </View>
        <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: ink, opacity: 0.14 }} />
          <Icon as={ChevronRight} size={20} color={ink} />
        </View>
      </View>
    </PressableScale>
  );
}
