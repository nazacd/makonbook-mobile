import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Grade } from 'ts-fsrs';
import { House } from 'lucide-react-native';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Text } from '@/components/Text';
import { useColors, type Palette } from '@/design/colors';
import { usePerson } from '@/lib/practice/hooks';
import { hasImage, imageUri } from '@/lib/vocab/files';
import { useDeck, useRecordReview, useSettings, useVocabState } from '@/lib/vocab/hooks';
import { activeLists, GRADES, newToday, preview, queue } from '@/lib/vocab/scheduler';
import type { VocabWord } from '@/lib/vocab/types';

const GRADE_COLOR: Record<number, keyof Palette> = {
  1: 'bad',
  2: 'watch',
  3: 'good',
  4: 'accent',
};

// The word in the example sentence in bold: "abate" also in "abated".
function Example({ text, word }: { text: string; word: string }) {
  const colors = useColors();
  const stem = word.toLowerCase().replace(/e$/, '');
  const parts = text.split(/(\s+)/);
  return (
    <Text variant="body" style={{ color: colors.ink2, fontStyle: 'italic' }}>
      {parts.map((p, i) =>
        stem.length > 2 && p.toLowerCase().replace(/^[^a-z]+/, '').startsWith(stem) ? (
          <Text key={i} style={{ fontWeight: '700', color: colors.ink }}>
            {p}
          </Text>
        ) : (
          p
        ),
      )}
    </Text>
  );
}

// A study session: cards due, then today's new words, one at a time. The
// student recalls the meaning, shows the answer and says how well they knew
// it; FSRS decides when it comes back. Every rating is saved at once, so the
// session can be left at any point.
export default function StudyScreen() {
  const colors = useColors();
  const person = usePerson();
  const queryClient = useQueryClient();
  const deck = useDeck();
  const state = useVocabState();
  const settings = useSettings();
  const record = useRecordReview();
  const [shown, setShown] = useState(false);
  const [done, setDone] = useState(0);
  // When the current card appeared: the time to answer runs from here to the rating.
  const [shownAt, setShownAt] = useState(() => Date.now());
  // "Now" for picking cards: refreshed after each rating, not on every render.
  const [now, setNow] = useState(() => new Date());

  if (!deck.data || !state.data || !settings.data) {
    return (
      <View className="flex-1 items-center justify-center bg-brand">
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const s = { ...settings.data, active: activeLists(settings.data, deck.data, state.data.cards) };
  const newLeft = Math.max(0, s.newPerDay - newToday(state.data.log, now));
  const q = queue(deck.data, s.active, state.data.cards, now, newLeft);
  const word: VocabWord | undefined = q.due[0] ?? q.fresh[0] ?? q.soon[0];
  const left = q.due.length + q.fresh.length + q.soon.length;
  const card = word ? state.data.cards.get(word.id) : undefined;
  const gaps = preview(card, now);

  const close = () => {
    queryClient.invalidateQueries({ queryKey: ['vocab-sync', person] }); // upload what was studied
    router.back();
  };

  // at: when the student tapped the rating (taken in the press handler).
  const answer = async (rating: Grade, at: number) => {
    if (!word) return;
    setShown(false);
    await record(word.id, card, rating, at - shownAt);
    setDone((n) => n + 1);
    setNow(new Date(at));
    setShownAt(at);
  };


  return (
    <View className="flex-1 bg-brand">
      <SafeAreaView style={{ flex: 1 }}>
        <View className="flex-1 px-5">
          <View className="flex-row items-center justify-between py-2">
            <Pressable onPress={close} hitSlop={10} className="p-2" accessibilityRole="button" accessibilityLabel="Finish studying">
              <Icon as={House} size={20} />
            </Pressable>
            <Text variant="subhead" style={{ color: colors.ink2, fontVariant: ['tabular-nums'] }}>
              {word ? `${done} done · ${left} left` : ''}
            </Text>
            <View style={{ width: 36 }} />
          </View>

          {!word ? (
            <View className="flex-1 justify-center gap-4">
              <Text variant="title" className="text-ink">
                {done > 0 ? 'Well done' : 'Nothing to study'}
              </Text>
              <Text variant="body" style={{ color: colors.ink2 }}>
                {done > 0
                  ? `You studied ${done} ${done === 1 ? 'word' : 'words'}. They come back when you are about to forget them.`
                  : 'No words are due. Come back later, or turn on another list.'}
              </Text>
              <Button label="Done" onPress={close} />
            </View>
          ) : (
            <>
              <ScrollView className="flex-1" contentContainerClassName="gap-5 py-6" key={word.id}>
                <View className="gap-1">
                  {!card && (
                    <Text variant="caption" style={{ color: colors.accent, textTransform: 'uppercase' }}>
                      New word
                    </Text>
                  )}
                  <Text variant="largeTitle" className="text-ink">
                    {word.word}
                  </Text>
                  {word.part_of_speech && (
                    <Text variant="subhead" style={{ color: colors.ink2, fontStyle: 'italic' }}>
                      {word.part_of_speech}
                    </Text>
                  )}
                </View>
                {shown ? (
                  <View className="gap-4">
                    <Text variant="title3" className="text-ink" style={{ fontWeight: '500' }}>
                      {word.definition}
                    </Text>
                    <Example text={word.example} word={word.word} />
                    {word.image && hasImage(word.image.file) && (
                      <Image
                        source={{ uri: imageUri(word.image.file) }}
                        accessibilityIgnoresInvertColors
                        style={{ width: '100%', aspectRatio: word.image.width / word.image.height, borderRadius: 16, maxHeight: 320 }}
                        resizeMode="contain"
                      />
                    )}
                  </View>
                ) : (
                  <Text variant="subhead" style={{ color: colors.ink3 }}>
                    Say what it means, then check.
                  </Text>
                )}
              </ScrollView>

              <View className="pb-4 pt-2">
                {shown ? (
                  <View className="flex-row gap-2">
                    {GRADES.map((g) => (
                      <PressableScale
                        key={g.rating}
                        onPress={() => answer(g.rating, Date.now())}
                        style={{ flex: 1 }}
                        className="h-16 items-center justify-center gap-0.5 rounded-2xl bg-surface"
                        accessibilityRole="button"
                        accessibilityLabel={`${g.label}, comes back in ${gaps[g.rating]}`}>
                        <Text variant="headline" style={{ color: colors[GRADE_COLOR[g.rating]] }}>
                          {g.label}
                        </Text>
                        <Text variant="caption" style={{ color: colors.ink3 }}>
                          {gaps[g.rating]}
                        </Text>
                      </PressableScale>
                    ))}
                  </View>
                ) : (
                  <Button label="Show answer" onPress={() => setShown(true)} />
                )}
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
