import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Calculator, ChevronLeft, Clock, ListOrdered, Target, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { PlacementObjects } from '@/components/PlacementObjects';
import { Text } from '@/components/Text';
import { useColors, useScheme } from '@/design/colors';
import { fonts } from '@/design/typography';
import { useSession } from '@/lib/session-context';
import { loadProgress } from '@/lib/storage';
import type { PlacementSubject } from '@/lib/types';

const SUBJECT_LABEL: Record<PlacementSubject, string> = {
  math: 'Math',
  english: 'English',
};

// The subject's colour fills the top, its objects thrown in from the right,
// behind the title; the facts as rows below; Begin in the thumb's reach.
export default function InstructionsScreen() {
  const { subject } = useLocalSearchParams<{ subject: PlacementSubject }>();
  const { beginTest, restoreTest } = useSession();
  const [checking, setChecking] = useState(true);
  const colors = useColors();
  const scheme = useScheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let cancelled = false;
    loadProgress(subject).then((progress) => {
      if (cancelled) return;
      if (progress) {
        restoreTest(progress);
        router.replace({ pathname: '/placement/[subject]/test', params: { subject } });
      } else {
        setChecking(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [subject, restoreTest]);

  if (checking) {
    return <View className="flex-1 bg-brand" />;
  }

  const background = subject === 'math' ? colors.math : colors.english2;
  const ink = colors.bg;
  const facts: [LucideIcon, string, string?][] = [
    [ListOrdered, '50 questions'],
    [Clock, '60 minutes'],
    [Target, 'One attempt', 'Answer to the best of your ability'],
    ...(subject === 'math' ? [[Calculator, 'Built-in calculator'] as [LucideIcon, string]] : []),
  ];

  return (
    <View className="flex-1 bg-brand">
      {/* The top is in the subject's colour: light in dark mode, dark in light. */}
      <StatusBar style={scheme === 'dark' ? 'dark' : 'light'} />
      <View style={{ minHeight: 250 + insets.top, paddingTop: insets.top, paddingHorizontal: 10, paddingBottom: 22, backgroundColor: background, overflow: 'hidden', justifyContent: 'space-between' }}>
        <PlacementObjects subject={subject} color={ink} hero top={insets.top} delay={280} />
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={({ pressed }) => ({ width: 44, height: 44, marginTop: 4, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
          <Icon as={ChevronLeft} size={24} color={ink} />
        </Pressable>
        <View style={{ paddingHorizontal: 10, paddingTop: 24 }} accessible accessibilityRole="header" accessibilityLabel={`${SUBJECT_LABEL[subject]} Level Check. Before you begin`}>
          <Text variant="caption" style={{ color: ink, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            {SUBJECT_LABEL[subject]} Level Check
          </Text>
          <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: fonts.displayBold, fontSize: 32, lineHeight: 38, color: ink, marginTop: 4 }}>
            Before you begin
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}>
        {facts.map(([icon, title, detail], i) => (
          <View
            key={title}
            className="flex-row items-center gap-3.5"
            style={{ minHeight: 64, paddingVertical: 12, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: colors.line }}
            accessible
            accessibilityLabel={detail ? `${title}. ${detail}` : title}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
              <Icon as={icon} size={19} />
            </View>
            <View className="flex-1">
              <Text variant="body" style={{ color: colors.ink, fontWeight: '500' }}>
                {title}
              </Text>
              {detail && (
                <Text variant="footnote" style={{ color: colors.ink2 }}>
                  {detail}
                </Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 12, borderTopWidth: 1, borderTopColor: colors.line }}>
        <Button
          label="Begin"
          onPress={() => {
            beginTest();
            router.replace({ pathname: '/placement/[subject]/test', params: { subject } });
          }}
        />
      </View>
    </View>
  );
}
