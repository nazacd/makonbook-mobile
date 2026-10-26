import { router, useNavigation } from 'expo-router';
import { BookOpen, Check, ChevronRight, Clock, CloudUpload, Layers, Plus, SlidersHorizontal } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConnectionLine } from '@/components/ConnectionLine';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { EmptyState, ErrorState, Skeleton } from '@/components/States';
import { Text } from '@/components/Text';
import { ThrownObjects, type Thrown } from '@/components/ThrownObjects';
import { ListsSheet, UnitChips } from '@/components/vocab/ListsSheet';
import { UnitBar } from '@/components/vocab/UnitBar';
import { useColors, type Palette } from '@/design/colors';
import { fonts } from '@/design/typography';
import { describeError } from '@/lib/api/errors';
import { useNow } from '@/lib/clock';
import { useDeck, useSaveSettings, useSettings, useVocabState, useVocabSync } from '@/lib/vocab/hooks';
import type { Settings } from '@/lib/vocab/local';
import { almostDone, listName, listProgress } from '@/lib/vocab/progress';
import { activeLists, formatGap, newToday, queue } from '@/lib/vocab/scheduler';

// English drawings from the spill set (no letters), resting along the
// screen's right edge beside today's count, above the Study button.
// [shape, colour, scale, right, top, opacity]: densest at the edge.
const OBJECTS: [string, keyof Palette, number, number, number, number][] = [
  ['nib', 'english', 1.4, -8, 0, 0.42],
  ['script', 'english2', 1.15, 44, 2, 0.3],
  ['quote', 'english', 1.2, 4, 52, 0.34],
  ['lozenge', 'english2', 0.8, 58, 58, 0.2],
  ['quill', 'english', 0.9, 92, 30, 0.14],
];

// The student's Words tab: progress only. Today's words and Study, then the
// lists being studied as read-only rows, each opening its words. Setup (new
// words a day, which lists) is in the Lists & pace sheet behind the sliders.
// Works offline once the deck is here.
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
  const [sheet, setSheet] = useState(false);

  // The objects are thrown in when the tab is opened from the tab bar.
  const navigation = useNavigation();
  const [play, setPlay] = useState(0);
  useEffect(
    () =>
      navigation.addListener('tabPress' as never, () => {
        if (!navigation.isFocused()) setPlay((p) => p + 1);
      }),
    [navigation],
  );

  const cards = state.data?.cards ?? new Map();
  const loaded: Settings = settings.data ?? { active: [], newPerDay: 20 };
  const s: Settings = { ...loaded, active: deck.data ? activeLists(loaded, deck.data, cards) : loaded.active };
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
  const studying = deck.data?.lists.filter((l) => s.active.includes(l.slug)) ?? [];
  const nearlyDone = deck.data ? almostDone(deck.data, s.active, cards, s.newPerDay) : null;
  const add = (slug: string) => save.mutate({ ...s, active: [...s.active, slug] });
  const objects: Thrown[] = OBJECTS.map(([shape, color, scale, right, top, opacity]) => ({ shape, color: colors[color], scale, right, top, opacity }));

  return (
    <>
      <ScrollView
        className="flex-1 bg-brand"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: 40, paddingHorizontal: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={pulling}
            onRefresh={() => {
              // The spinner is for a pull only, not the quiet syncs a change starts.
              setPulling(true);
              sync.refetch().finally(() => setPulling(false));
            }}
            tintColor={colors.ink2}
            colors={[colors.ink]}
            progressBackgroundColor={colors.surface}
          />
        }>
        <ConnectionLine detail="progress sends when online" style={{ marginBottom: 4 }} />
        {deck.data && deck.data.lists.length > 0 && (
          <View className="flex-row justify-end" style={{ marginRight: -10, marginBottom: -16, zIndex: 2 }}>
            <Pressable
              onPress={() => setSheet(true)}
              accessibilityRole="button"
              accessibilityLabel="Lists and pace"
              style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
              <Icon as={SlidersHorizontal} size={22} color={colors.ink} />
            </Pressable>
          </View>
        )}

        {!deck.data ? (
          deck.isPending || sync.isPending ? (
            <View className="gap-4" style={{ paddingTop: 44 }}>
              <Skeleton width={80} height={64} />
              <Skeleton height={52} radius={14} />
              <Skeleton height={20} />
            </View>
          ) : (
            <View style={{ paddingTop: 44 }}>
              <ErrorState
                title="Couldn’t load the words"
                message={sync.error ? describeError(sync.error) : 'Pull down to try again.'}
                onRetry={() => sync.refetch()}
                retrying={sync.isFetching}
              />
            </View>
          )
        ) : deck.data.lists.length === 0 ? (
          <EmptyState icon={BookOpen} title="Words are on the way" message="The word lists appear here once they are ready." />
        ) : (
          <>
            <View style={{ minHeight: 120, marginBottom: 28 }}>
              <View style={{ position: 'absolute', top: 0, height: 112, right: -20, width: 150 }}>
                <ThrownObjects items={objects} play={play} travel={(o) => (o.right ?? 0) + 40} />
              </View>
              <Text variant="subhead" style={{ color: colors.ink2 }}>
                Today
              </Text>
              {s.active.length === 0 ? (
                <>
                  <Text variant="title" style={{ color: colors.ink, marginTop: 10, maxWidth: 236 }}>
                    Pick a list
                  </Text>
                  <Text variant="subhead" style={{ color: colors.ink2, marginTop: 4, maxWidth: 236 }}>
                    About 25 SAT words in each. Start with {listName(deck.data.lists[0]!.title)}.
                  </Text>
                </>
              ) : toStudy > 0 ? (
                <>
                  <Text
                    style={{ fontFamily: fonts.displayBold, fontSize: 64, lineHeight: 72, color: colors.ink, fontVariant: ['tabular-nums'] }}
                    maxFontSizeMultiplier={1.2}
                    accessibilityLabel={`${toStudy} words today`}>
                    {toStudy}
                  </Text>
                  <Text variant="subhead" style={{ color: colors.ink2, fontVariant: ['tabular-nums'], maxWidth: 236 }}>
                    {q!.due.length > 0 && (
                      <>
                        <Text variant="subhead" style={{ color: colors.ink, fontWeight: '500' }}>
                          {q!.due.length}
                        </Text>{' '}
                        to review
                      </>
                    )}
                    {q!.due.length > 0 && q!.fresh.length > 0 && ' · '}
                    {q!.fresh.length > 0 && (
                      <>
                        <Text variant="subhead" style={{ color: colors.ink, fontWeight: '500' }}>
                          {q!.fresh.length}
                        </Text>{' '}
                        new
                      </>
                    )}
                  </Text>
                  <View style={{ marginTop: 16 }}>
                    <Button label="Study" onPress={() => router.push('/vocab/study')} />
                  </View>
                </>
              ) : (
                <>
                  <View className="flex-row items-center gap-2.5" style={{ marginTop: 12, maxWidth: 236 }}>
                    <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.goodTint }}>
                      <Icon as={Check} size={20} strokeWidth={2.5} color={colors.good} />
                    </View>
                    <Text variant="title2" style={{ color: colors.ink, flexShrink: 1 }}>
                      All caught up
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2" style={{ marginTop: 12, maxWidth: 236 }}>
                    <Icon as={Clock} size={16} color={colors.ink3} />
                    <Text variant="subhead" style={{ color: colors.ink2, flexShrink: 1 }}>
                      {next != null ? `Next word in ${formatGap(next - now.getTime())}` : 'Add a list for more words'}
                      {newLeft === 0 ? ' · today’s new words are done' : ''}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {s.active.length === 0 ? (
              <UnitChips lists={deck.data.lists} onAdd={add} />
            ) : (
              <>
                <Text variant="title3" style={{ color: colors.ink, marginBottom: 4 }} accessibilityRole="header">
                  Studying
                </Text>
                {studying.map((l, i) => {
                  const p = listProgress(l, cards);
                  return (
                    <Pressable
                      key={l.slug}
                      onPress={() => router.push({ pathname: '/vocab/list/[slug]', params: { slug: l.slug } })}
                      accessibilityRole="button"
                      accessibilityLabel={`${listName(l.title)}, ${p.learned} of ${p.total} learned`}
                      style={({ pressed }) => ({ marginHorizontal: -20, paddingHorizontal: 20, backgroundColor: pressed ? colors.surface2 : 'transparent' })}>
                      <View className="flex-row items-center gap-3.5" style={{ minHeight: 60, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}>
                        <Text variant="title3" style={{ color: colors.ink, fontSize: 18, lineHeight: 23, width: 72 }} numberOfLines={1}>
                          {listName(l.title)}
                        </Text>
                        <View className="flex-1">
                          <UnitBar progress={p} />
                        </View>
                        <Text variant="subhead" style={{ color: colors.ink2, fontWeight: '500', fontVariant: ['tabular-nums'], minWidth: 40, textAlign: 'right' }}>
                          {p.learned}/{p.total}
                        </Text>
                        <Icon as={ChevronRight} size={16} color={colors.ink3} />
                      </View>
                    </Pressable>
                  );
                })}
                {nearlyDone && (
                  <View className="flex-row flex-wrap items-center gap-x-2" style={{ marginTop: 4 }}>
                    <Icon as={Layers} size={17} color={colors.ink3} />
                    <Text variant="subhead" style={{ color: colors.ink2 }}>
                      {listName(nearlyDone.ending.title)} almost done ·
                    </Text>
                    <Pressable
                      onPress={() => add(nearlyDone.next.slug)}
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${listName(nearlyDone.next.title)}`}
                      style={({ pressed }) => ({ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4, opacity: pressed ? 0.6 : 1 })}>
                      <Icon as={Plus} size={15} color={colors.accent} />
                      <Text variant="subhead" style={{ color: colors.accent, fontWeight: '600' }}>
                        Add {listName(nearlyDone.next.title)}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </>
            )}

            {(sync.data?.pending ?? 0) > 0 && (
              <View className="flex-row items-center gap-2" style={{ marginTop: 20 }}>
                <Icon as={CloudUpload} size={17} color={colors.ink3} />
                <Text variant="subhead" style={{ color: colors.ink2 }}>
                  Progress sends to your teachers when you’re online
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
      {deck.data && (
        <ListsSheet
          visible={sheet}
          deck={deck.data}
          settings={s}
          onClose={(nextSettings) => {
            setSheet(false);
            const changed = nextSettings.newPerDay !== s.newPerDay || nextSettings.active.join() !== s.active.join();
            if (changed) save.mutate(nextSettings);
          }}
        />
      )}
    </>
  );
}
