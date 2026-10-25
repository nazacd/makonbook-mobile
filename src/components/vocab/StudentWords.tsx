import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Notice } from '@/components/Notice';
import { PressableScale } from '@/components/PressableScale';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import { describeError } from '@/lib/api/errors';
import { useNow } from '@/lib/clock';
import { useDeck, useSaveSettings, useSettings, useVocabState, useVocabSync } from '@/lib/vocab/hooks';
import { NEW_PER_DAY } from '@/lib/vocab/local';
import { activeLists, formatGap, isLearned, newToday, queue } from '@/lib/vocab/scheduler';

// The student's Words tab: what to study today, the lists (each turned on or
// off), and how many words a day are new. Works offline once the deck is here.
export function StudentWords() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const now = new Date(useNow());
  const deck = useDeck();
  const state = useVocabState();
  const settings = useSettings();
  const save = useSaveSettings();
  const sync = useVocabSync(true);
  const [pulling, setPulling] = useState(false);

  const cards = state.data?.cards ?? new Map();
  const loaded = settings.data ?? { active: [], newPerDay: 20 };
  const s = { ...loaded, active: deck.data ? activeLists(loaded, deck.data, cards) : loaded.active };
  const newLeft = Math.max(0, s.newPerDay - newToday(state.data?.log ?? [], now));
  const q = deck.data ? queue(deck.data, s.active, cards, now, newLeft) : null;
  const toStudy = q ? q.due.length + q.fresh.length : 0;
  // When the next card comes due, if nothing is due now.
  let next: number | null = null;
  if (deck.data && toStudy === 0) {
    for (const l of deck.data.lists) {
      if (!s.active.includes(l.slug)) continue;
      for (const w of l.words) {
        const due = cards.get(w.id)?.due.getTime();
        if (due != null && (next == null || due < next)) next = due;
      }
    }
  }

  const toggle = (slug: string, on: boolean) =>
    save.mutate({ ...s, active: on ? [...s.active, slug] : s.active.filter((x) => x !== slug) });

  return (
    <ScrollView
      className="flex-1 bg-brand"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 32 }}
      contentContainerClassName="gap-4 px-5"
      refreshControl={
        <RefreshControl
          refreshing={pulling}
          onRefresh={() => {
            // The spinner is for a pull only, not the quiet syncs a change starts.
            setPulling(true);
            sync.refetch().finally(() => setPulling(false));
          }}
          tintColor={colors.accent}
          colors={[colors.accent]}
          progressBackgroundColor={colors.surface}
        />
      }>
      <View className="gap-1 pb-2">
        <Text variant="subhead" style={{ color: colors.ink2 }}>
          SAT vocabulary
        </Text>
        <Text variant="largeTitle" className="text-ink" accessibilityRole="header">
          Words
        </Text>
      </View>

      {!deck.data ? (
        deck.isPending || sync.isPending ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 48 }} />
        ) : (
          <Notice
            tone="error"
            title="Couldn’t load the words"
            message={sync.error ? describeError(sync.error) : 'Pull down to try again.'}
          />
        )
      ) : deck.data.lists.length === 0 ? (
        <View className="items-center gap-2 px-4 py-12">
          <Text variant="title3" className="text-ink">
            Words are on the way
          </Text>
          <Text variant="subhead" style={{ color: colors.ink2, textAlign: 'center' }}>
            The word lists appear here once they are ready.
          </Text>
        </View>
      ) : (
        <>
          <View className="gap-3 rounded-3xl px-5 py-5" style={{ backgroundColor: colors.accentTint }}>
            <Text variant="caption" style={{ color: colors.accent, textTransform: 'uppercase' }}>
              Today
            </Text>
            {s.active.length === 0 ? (
              <Text variant="title3" className="text-ink">
                Turn on a list below to start.
              </Text>
            ) : toStudy > 0 ? (
              <>
                <Text variant="title2" className="text-ink" style={{ fontVariant: ['tabular-nums'] }}>
                  {q!.due.length > 0 && `${q!.due.length} to review`}
                  {q!.due.length > 0 && q!.fresh.length > 0 && ' · '}
                  {q!.fresh.length > 0 && `${q!.fresh.length} new`}
                </Text>
                <Button label="Study" onPress={() => router.push('/vocab/study')} />
              </>
            ) : (
              <>
                <Text variant="title3" className="text-ink">
                  All caught up
                </Text>
                <Text variant="subhead" style={{ color: colors.ink2 }}>
                  {next != null
                    ? `The next word is due in ${formatGap(next - now.getTime())}.`
                    : 'Turn on another list for more words.'}
                  {newLeft === 0 ? ' Today’s new words are done.' : ''}
                </Text>
              </>
            )}
          </View>

          {(sync.data?.pending ?? 0) > 0 && (
            <Text variant="footnote" style={{ color: colors.ink3 }} className="px-1">
              Your progress is on this phone; it goes to your teachers when you’re online.
            </Text>
          )}

          <View className="gap-2">
            <Text variant="footnote" style={{ color: colors.ink2, textTransform: 'uppercase' }} className="px-1">
              New words a day
            </Text>
            <View className="flex-row gap-2" accessibilityRole="radiogroup">
              {NEW_PER_DAY.map((n) => {
                const selected = s.newPerDay === n;
                return (
                  // Colours as classes, not a style function: NativeWind on a
                  // phone doesn't apply a style function next to className.
                  <PressableScale
                    key={n}
                    onPress={() => save.mutate({ ...s, newPerDay: n })}
                    pressedScale={0.95}
                    style={{ flex: 1 }}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={`${n} new words a day`}
                    className={`h-11 items-center justify-center rounded-xl ${selected ? 'bg-primary' : 'bg-surface'}`}>
                    <Text variant="headline" className={selected ? 'text-on-primary' : 'text-ink'}>
                      {n}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>
          </View>

          <View className="gap-2">
            <Text variant="footnote" style={{ color: colors.ink2, textTransform: 'uppercase' }} className="px-1">
              Lists
            </Text>
            <View className="overflow-hidden rounded-3xl bg-surface">
              {deck.data.lists.map((l, i) => {
                const on = s.active.includes(l.slug);
                let started = 0;
                let learned = 0;
                for (const w of l.words) {
                  const c = cards.get(w.id);
                  if (c) started++;
                  if (c && isLearned(c)) learned++;
                }
                return (
                  <Pressable
                    key={l.slug}
                    onPress={() => toggle(l.slug, !on)}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={l.title}
                    style={({ pressed }) => ({ backgroundColor: pressed ? colors.surface2 : 'transparent' })}>
                    <View className="ml-5" style={i ? { borderTopWidth: 1, borderTopColor: colors.line } : undefined}>
                      <View className="min-h-[60px] flex-row items-center gap-3 py-3 pr-5">
                        <View className="flex-1 gap-0.5">
                          <Text variant="body" className="text-ink">
                            {l.title}
                          </Text>
                          <Text variant="footnote" style={{ color: colors.ink3 }}>
                            {l.words.length} words · {started} started · {learned} learned
                          </Text>
                        </View>
                        <Switch
                          value={on}
                          onValueChange={(v) => toggle(l.slug, v)}
                          trackColor={{ false: colors.track, true: colors.accent }}
                          thumbColor={colors.ink}
                        />
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <Text variant="footnote" style={{ color: colors.ink3 }} className="px-1">
              A word counts as learned once its next review is three weeks or more away.
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}
