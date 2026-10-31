import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { House } from 'lucide-react-native';

import { Icon } from '@/components/Icon';
import { QuestionNavigatorGrid } from '@/components/QuestionNavigatorGrid';
import { Text } from '@/components/Text';
import { useColors, type Palette } from '@/design/colors';
import { fonts } from '@/design/typography';
import { useGoHome, useHomeHref } from '@/lib/navigation';
import { useSession } from '@/lib/session-context';
import type { DisplayLevel, PlacementSubject, QuestionOutcome } from '@/lib/types';

const LEVELS: DisplayLevel[] = ['Foundation', 'Pre-SAT', 'Advanced'];

// The level set large with where it sits on the three-step scale, how many
// answers were right, wrong and blank, then every question.
export default function ResultsScreen() {
  const { subject } = useLocalSearchParams<{ subject: PlacementSubject }>();
  const { state } = useSession();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const home = useHomeHref();
  const goHome = useGoHome();

  // Nothing to show (opened directly, or the results were cleared).
  if (state.status !== 'submitted' || !state.results) {
    return <Redirect href={home} />;
  }

  const { level, perQuestion } = state.results;
  const reached = LEVELS.indexOf(level);
  const count = (o: QuestionOutcome) => state.questions.filter((q) => perQuestion[q.id] === o).length;
  const counts: { n: number; label: string; tone: keyof Palette }[] = [
    { n: count('correct'), label: 'right', tone: 'good' },
    { n: count('incorrect'), label: 'wrong', tone: 'bad' },
    { n: count('skipped'), label: 'blank', tone: 'ink' },
  ];

  return (
    <View className="flex-1 bg-brand" style={{ paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 10, paddingTop: 4 }}>
        <Pressable
          onPress={goHome}
          accessibilityRole="button"
          accessibilityLabel="Home"
          style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
          <Icon as={House} size={22} />
        </Pressable>
      </View>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: insets.bottom + 40 }}>
        <View accessible accessibilityRole="header" accessibilityLabel={`Recommended starting level: ${level}`}>
          <Text variant="caption" style={{ color: colors.ink2, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Recommended starting level
          </Text>
          <Text maxFontSizeMultiplier={1.2} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={{ fontFamily: fonts.displayBold, fontSize: 52, lineHeight: 58, color: colors.accent, marginTop: 4 }}>
            {level}
          </Text>
        </View>

        <View className="flex-row" style={{ gap: 6, marginTop: 18 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {LEVELS.map((l, i) => (
            <View key={l} className="flex-1">
              <View style={{ height: 8, borderRadius: 4, backgroundColor: i <= reached ? colors.accent : colors.track }} />
              <Text variant="caption" numberOfLines={1} style={{ marginTop: 6, color: i === reached ? colors.ink : colors.ink3, fontWeight: i === reached ? '600' : '400' }}>
                {l}
              </Text>
            </View>
          ))}
        </View>

        <View className="flex-row" style={{ marginTop: 28, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line }}>
          {counts.map((c, i) => (
            <View
              key={c.label}
              className="flex-1"
              style={{ paddingVertical: 14, paddingLeft: i > 0 ? 16 : 0, borderLeftWidth: i > 0 ? 1 : 0, borderLeftColor: colors.line }}
              accessible
              accessibilityLabel={`${c.n} ${c.label}`}>
              <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: fonts.displaySemiBold, fontSize: 26, lineHeight: 30, color: colors[c.tone], fontVariant: ['tabular-nums'] }}>
                {c.n}
              </Text>
              <Text variant="footnote" style={{ color: colors.ink2 }}>
                {c.label}
              </Text>
            </View>
          ))}
        </View>

        <Text variant="title3" style={{ color: colors.ink, marginTop: 32 }} accessibilityRole="header">
          Question Review
        </Text>
        <View className="flex-row flex-wrap" style={{ columnGap: 16, rowGap: 6, marginTop: 8, marginBottom: 14 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Key label="Right" swatch={{ backgroundColor: colors.goodTint }} />
          <Key label="Wrong" swatch={{ backgroundColor: colors.bad }} />
          <Key label="Blank" swatch={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.lineStrong }} />
        </View>
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
      </ScrollView>
    </View>
  );
}

function Key({ label, swatch }: { label: string; swatch: object }) {
  const colors = useColors();
  return (
    <View className="flex-row items-center gap-1.5">
      <View style={[{ width: 12, height: 12, borderRadius: 4 }, swatch]} />
      <Text variant="footnote" style={{ color: colors.ink2 }}>
        {label}
      </Text>
    </View>
  );
}
