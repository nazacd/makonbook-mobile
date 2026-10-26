import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Check, Sparkles, X } from 'lucide-react-native';
import { useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Grade } from 'ts-fsrs';

import { Button } from '@/components/Button';
import { Confetti } from '@/components/Confetti';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Skeleton } from '@/components/States';
import { Text } from '@/components/Text';
import { ThrownObjects, type Thrown } from '@/components/ThrownObjects';
import { useColors, type Palette } from '@/design/colors';
import { fonts } from '@/design/typography';
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

// English drawings resting along both edges of the finish, thrown in from
// their own side. [shape, colour, scale, edge, top, opacity]
const FINISH_LEFT: [string, keyof Palette, number, number, number, number][] = [
  ['quill', 'english2', 1.1, -6, 40, 0.34],
  ['lozenge', 'english', 0.8, 12, 170, 0.24],
  ['quote', 'english', 0.9, -8, 270, 0.28],
];
const FINISH_RIGHT: [string, keyof Palette, number, number, number, number][] = [
  ['nib', 'english', 1.2, -8, 10, 0.4],
  ['quote', 'english2', 1, 10, 130, 0.3],
  ['script', 'english', 0.9, -4, 250, 0.26],
];

// The word in the example sentence in bold: "abate" also in "abated".
function Example({ text, word }: { text: string; word: string }) {
  const colors = useColors();
  const stem = word.toLowerCase().replace(/e$/, '');
  const parts = text.split(/(\s+)/);
  return (
    <View style={{ marginTop: 10, paddingLeft: 14, borderLeftWidth: 2, borderLeftColor: colors.lineStrong }}>
      <Text variant="callout" style={{ color: colors.ink2, fontStyle: 'italic', lineHeight: 24 }}>
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
    </View>
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
  const [newDone, setNewDone] = useState(0);
  // When the current card appeared: the time to answer runs from here to the rating.
  const [shownAt, setShownAt] = useState(() => Date.now());
  // "Now" for picking cards: refreshed after each rating, not on every render.
  const [now, setNow] = useState(() => new Date());

  const close = () => {
    queryClient.invalidateQueries({ queryKey: ['vocab-sync', person] }); // upload what was studied
    router.back();
  };

  if (!deck.data || !state.data || !settings.data) {
    return (
      <View className="flex-1 gap-4 bg-brand px-5" style={{ paddingTop: 120 }}>
        <Skeleton width={180} height={48} />
        <Skeleton width={90} />
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
  const progress = done + left > 0 ? done / (done + left) : 1;

  // at: when the student tapped the rating (taken in the press handler).
  const answer = async (rating: Grade, at: number) => {
    if (!word) return;
    setShown(false);
    const wasNew = !card;
    await record(word.id, card, rating, at - shownAt);
    setDone((n) => n + 1);
    if (wasNew) setNewDone((n) => n + 1);
    setNow(new Date(at));
    setShownAt(at);
  };

  return (
    <View className="flex-1 bg-brand">
      {!word && done > 0 && <Confetti />}
      <SafeAreaView style={{ flex: 1 }}>
        <View className="flex-1 px-5">
          <View className="flex-row items-center gap-3" style={{ height: 52 }}>
            <Pressable
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel="Finish studying"
              style={({ pressed }) => ({ width: 44, height: 44, marginLeft: -10, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
              <Icon as={X} size={22} color={colors.ink} />
            </Pressable>
            <View
              className="flex-1"
              style={{ height: 6, borderRadius: 3, backgroundColor: colors.track, overflow: 'hidden' }}
              accessible
              accessibilityLabel={`${done} done, ${left} left`}>
              <View style={{ width: `${progress * 100}%`, height: 6, borderRadius: 3, backgroundColor: colors.primary }} />
            </View>
            <Text variant="subhead" style={{ color: colors.ink2, fontWeight: '500', fontVariant: ['tabular-nums'], minWidth: 48, textAlign: 'right' }}>
              {left} left
            </Text>
          </View>

          {!word ? (
            <Finish done={done} newDone={newDone} onClose={close} />
          ) : (
            <>
              <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: 28, paddingBottom: 24 }} key={word.id}>
                {!card && (
                  <View className="flex-row items-center gap-1.5" style={{ marginBottom: 8 }}>
                    <Icon as={Sparkles} size={15} color={colors.accent} />
                    <Text variant="subhead" style={{ color: colors.accent, fontWeight: '500' }}>
                      New word
                    </Text>
                  </View>
                )}
                <Text
                  style={{ fontFamily: fonts.displayBold, fontSize: 44, lineHeight: 50, color: colors.ink }}
                  maxFontSizeMultiplier={1.2}
                  accessibilityRole="header">
                  {word.word}
                </Text>
                {word.part_of_speech && (
                  <Text variant="callout" style={{ color: colors.ink2, fontStyle: 'italic', marginTop: 4 }}>
                    {word.part_of_speech}
                  </Text>
                )}
                {shown ? (
                  <View style={{ marginTop: 22 }}>
                    <Text variant="body" style={{ color: colors.ink, fontSize: 20, lineHeight: 28, fontWeight: '500' }}>
                      {word.definition}
                    </Text>
                    <Example text={word.example} word={word.word} />
                    {word.image && hasImage(word.image.file) && (
                      <Image
                        source={{ uri: imageUri(word.image.file) }}
                        accessibilityIgnoresInvertColors
                        style={{ width: '100%', aspectRatio: word.image.width / word.image.height, borderRadius: 14, maxHeight: 320, marginTop: 18 }}
                        resizeMode="contain"
                      />
                    )}
                  </View>
                ) : (
                  <Text variant="subhead" style={{ color: colors.ink3, marginTop: 20 }}>
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
                        // The box on the outer view (style), the layout on the Pressable inside (className).
                        style={{ flex: 1, height: 64, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, overflow: 'hidden' }}
                        className="flex-1 items-center justify-center gap-0.5"
                        accessibilityRole="button"
                        accessibilityLabel={`${g.label}, comes back in ${gaps[g.rating]}`}>
                        <Text variant="callout" style={{ color: colors[GRADE_COLOR[g.rating]], fontWeight: '600' }}>
                          {g.label}
                        </Text>
                        <Text variant="caption" style={{ color: colors.ink3, fontWeight: '400', fontVariant: ['tabular-nums'] }}>
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

// The end of a session, centred: a check, how many words, and the English
// drawings in from both edges (the confetti is the screen's).
function Finish({ done, newDone, onClose }: { done: number; newDone: number; onClose: () => void }) {
  const colors = useColors();
  const toThrown = (list: typeof FINISH_LEFT, side: 'left' | 'right'): Thrown[] =>
    list.map(([shape, color, scale, edge, top, opacity]) => ({ shape, color: colors[color], scale, [side]: edge, top, opacity }));
  return (
    <>
      <View className="flex-1 items-center justify-center" style={{ marginHorizontal: -20, paddingHorizontal: 44 }}>
        {done > 0 && (
          <View style={{ position: 'absolute', top: 90, bottom: 120, left: 0, right: 0 }}>
            <ThrownObjects items={toThrown(FINISH_LEFT, 'left')} play={0} travel={(o) => (o.left ?? 0) + 40} />
            <ThrownObjects items={toThrown(FINISH_RIGHT, 'right')} play={0} travel={(o) => (o.right ?? 0) + 40} />
          </View>
        )}
        {done > 0 && (
          <View style={{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.goodTint, marginBottom: 18 }}>
            <Icon as={Check} size={36} strokeWidth={2.4} color={colors.good} />
          </View>
        )}
        <Text variant="title" style={{ color: colors.ink, textAlign: 'center' }} accessibilityRole="header">
          {done > 0 ? 'Well done' : 'Nothing to study'}
        </Text>
        <Text variant="body" style={{ color: colors.ink2, textAlign: 'center', marginTop: 10 }}>
          {done > 0 ? 'They come back when you’re about to forget them.' : 'No words are due. Come back later, or add a list.'}
        </Text>
        {done > 0 && (
          <View className="flex-row gap-6" style={{ marginTop: 18 }}>
            <Stat value={done} label={done === 1 ? 'word' : 'words'} />
            {newDone > 0 && <Stat value={newDone} label="new" />}
          </View>
        )}
      </View>
      <View className="pb-4 pt-2">
        <Button label="Done" onPress={onClose} />
      </View>
    </>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  const colors = useColors();
  return (
    <View className="items-center" accessible accessibilityLabel={`${value} ${label}`}>
      <Text style={{ fontFamily: fonts.displayBold, fontSize: 26, lineHeight: 30, color: colors.ink, fontVariant: ['tabular-nums'] }} maxFontSizeMultiplier={1.2}>
        {value}
      </Text>
      <Text variant="footnote" style={{ color: colors.ink2 }}>
        {label}
      </Text>
    </View>
  );
}
