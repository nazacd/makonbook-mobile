import { Stack, useLocalSearchParams } from 'expo-router';
import { Check, FileQuestion } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { EmptyState, Skeleton } from '@/components/States';
import { Text } from '@/components/Text';
import { UnitBar } from '@/components/vocab/UnitBar';
import { useColors } from '@/design/colors';
import { useNow } from '@/lib/clock';
import { useDeck, useVocabState } from '@/lib/vocab/hooks';
import { listName, listProgress } from '@/lib/vocab/progress';
import { formatGap, isLearned, type Cards } from '@/lib/vocab/scheduler';
import type { VocabWord } from '@/lib/vocab/types';

type Kind = 'learning' | 'learned' | 'new';

// One list's words, read-only, by where each stands: learning (when it comes
// back, "Due" when it's due now), learned, and new (not started yet).
export default function VocabListScreen() {
  const colors = useColors();
  const now = useNow();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const deck = useDeck();
  const state = useVocabState();
  const list = deck.data?.lists.find((l) => l.slug === slug);
  const cards: Cards = state.data?.cards ?? new Map();

  if (!deck.data || !state.data) {
    return (
      <View className="flex-1 gap-4 bg-brand px-5 pt-4">
        <Skeleton height={8} />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={20} />
        ))}
      </View>
    );
  }
  if (!list) {
    return (
      <View className="flex-1 bg-brand px-5">
        <EmptyState icon={FileQuestion} title="List not found" message="This list isn’t in the words on this phone." />
      </View>
    );
  }

  const due = (w: VocabWord) => cards.get(w.id)!.due.getTime();
  const learning = list.words.filter((w) => cards.has(w.id) && !isLearned(cards.get(w.id)!)).sort((a, b) => due(a) - due(b));
  const learned = list.words.filter((w) => cards.has(w.id) && isLearned(cards.get(w.id)!)).sort((a, b) => due(a) - due(b));
  const fresh = list.words.filter((w) => !cards.has(w.id));
  const p = listProgress(list, cards);
  const when = (w: VocabWord) => (due(w) <= now ? null : `in ${formatGap(due(w) - now)}`);

  const section = (title: string, words: VocabWord[], kind: Kind) =>
    words.length > 0 && (
      <View>
        <View className="flex-row items-baseline justify-between" style={{ marginBottom: 2 }}>
          <Text variant="title3" style={{ color: colors.ink }} accessibilityRole="header">
            {title}
          </Text>
          <Text variant="footnote" style={{ color: colors.ink3, fontVariant: ['tabular-nums'] }}>
            {words.length}
          </Text>
        </View>
        {words.map((w, i) => {
          const back = kind === 'new' ? null : when(w);
          return (
            <View
              key={w.id}
              className="flex-row items-center gap-3"
              style={{ minHeight: 60, paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}
              accessible
              accessibilityLabel={`${w.word}${w.part_of_speech ? `, ${w.part_of_speech}` : ''}: ${w.definition}. ${kind === 'new' ? 'New' : back ? `Comes back ${back}` : 'Due now'}`}>
              <View className="flex-1 gap-0.5">
                <Text variant="body" numberOfLines={1}>
                  <Text variant="body" style={{ color: colors.ink, fontWeight: '700' }}>
                    {w.word}
                  </Text>
                  {w.part_of_speech && (
                    <Text variant="footnote" style={{ color: colors.ink3, fontStyle: 'italic' }}>
                      {'  '}
                      {w.part_of_speech}
                    </Text>
                  )}
                </Text>
                <Text variant="footnote" numberOfLines={1} style={{ color: colors.ink3 }}>
                  {w.definition}
                </Text>
              </View>
              {kind === 'learned' ? (
                <View className="flex-row items-center gap-1">
                  <Icon as={Check} size={15} strokeWidth={2.4} color={colors.good} />
                  <Text variant="subhead" style={{ color: colors.ink2, fontVariant: ['tabular-nums'] }}>
                    {back ?? 'due'}
                  </Text>
                </View>
              ) : kind === 'learning' ? (
                <Text variant="subhead" style={{ color: back ? colors.ink2 : colors.accent, fontWeight: back ? '400' : '600', fontVariant: ['tabular-nums'] }}>
                  {back ?? 'Due'}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
    );

  return (
    <ScrollView className="flex-1 bg-brand" contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 48, gap: 26 }}>
      <Stack.Screen options={{ title: listName(list.title) }} />
      <View className="gap-2">
        <UnitBar progress={p} height={8} />
        <Text variant="subhead" style={{ color: colors.ink2, fontVariant: ['tabular-nums'] }}>
          <Text variant="subhead" style={{ color: colors.ink, fontWeight: '600' }}>
            {p.learned}
          </Text>{' '}
          learned · {learning.length} learning · {fresh.length} new
        </Text>
      </View>
      {section('Learning', learning, 'learning')}
      {section('Learned', learned, 'learned')}
      {section('New', fresh, 'new')}
    </ScrollView>
  );
}
