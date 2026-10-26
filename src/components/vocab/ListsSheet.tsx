import { CircleMinus, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import * as haptics from '@/design/haptics';
import { NEW_PER_DAY, type Settings } from '@/lib/vocab/local';
import { listName } from '@/lib/vocab/progress';
import type { Deck } from '@/lib/vocab/types';

type ListsSheetProps = {
  visible: boolean;
  deck: Deck;
  settings: Settings;
  /** Called once, as the sheet closes, with what was chosen in it. */
  onClose: (next: Settings) => void;
};

// "Lists & pace": the setup kept off the Words tab. New words a day, the
// lists being studied (each with a minus to stop it), and the other lists as
// chips to add. Changes apply when the sheet closes, not on every tap.
export function ListsSheet({ visible, deck, settings, onClose }: ListsSheetProps) {
  const reduceMotion = useReducedMotion();
  return (
    <Modal visible={visible} transparent animationType={reduceMotion ? 'fade' : 'slide'} onRequestClose={() => onClose(settings)} statusBarTranslucent>
      {visible && <Sheet deck={deck} settings={settings} onClose={onClose} />}
    </Modal>
  );
}

function Sheet({ deck, settings, onClose }: Omit<ListsSheetProps, 'visible'>) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  // A draft, started when the sheet opens.
  const [draft, setDraft] = useState(settings);
  const close = () => onClose(draft);
  const studying = deck.lists.filter((l) => draft.active.includes(l.slug));
  const others = deck.lists.filter((l) => !draft.active.includes(l.slug));
  const toggle = (slug: string, on: boolean) => {
    haptics.selection();
    setDraft((d) => ({ ...d, active: on ? [...d.active, slug] : d.active.filter((s) => s !== slug) }));
  };

  return (
    <View className="flex-1">
      <Pressable className="flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.45)', minHeight: insets.top + 60 }} onPress={close} accessibilityLabel="Close" />
      <View style={{ maxHeight: '88%', backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 10 }}>
        <View className="self-center" style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.lineStrong }} />
        <View className="flex-row items-center justify-between px-5" style={{ marginTop: 6 }}>
          <Text variant="title2" style={{ color: colors.ink }} accessibilityRole="header">
            Lists & pace
          </Text>
          <Pressable onPress={close} accessibilityRole="button" style={({ pressed }) => ({ minHeight: 44, justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
            <Text variant="headline" style={{ color: colors.accent }}>
              Done
            </Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: insets.bottom + 24 }}>
          <Text variant="subhead" style={{ color: colors.ink2, marginBottom: 8 }}>
            New words a day
          </Text>
          <SegmentedControl
            options={NEW_PER_DAY.map((n) => ({ value: String(n), label: String(n) }))}
            value={String(draft.newPerDay)}
            onChange={(v) => setDraft((d) => ({ ...d, newPerDay: Number(v) }))}
            accessibilityLabel="New words a day"
          />

          {studying.length > 0 && (
            <>
              <Text variant="title3" style={{ color: colors.ink, marginTop: 28, marginBottom: 6 }} accessibilityRole="header">
                Studying
              </Text>
              {studying.map((l, i) => (
                <View key={l.slug} className="flex-row items-center gap-3" style={{ minHeight: 56, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}>
                  <View className="flex-1">
                    <Text variant="title3" style={{ color: colors.ink, fontSize: 17, lineHeight: 22 }}>
                      {listName(l.title)}
                    </Text>
                    <Text variant="footnote" style={{ color: colors.ink3 }}>
                      {l.words.length} words
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => toggle(l.slug, false)}
                    accessibilityRole="button"
                    accessibilityLabel={`Stop studying ${listName(l.title)}`}
                    style={({ pressed }) => ({ width: 44, height: 44, marginRight: -10, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
                    <Icon as={CircleMinus} size={22} color={colors.ink3} />
                  </Pressable>
                </View>
              ))}
            </>
          )}

          {others.length > 0 && (
            <>
              <Text variant="title3" style={{ color: colors.ink, marginTop: 28, marginBottom: 14 }} accessibilityRole="header">
                Add a list
              </Text>
              <UnitChips lists={others} onAdd={(slug) => toggle(slug, true)} />
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

/** Lists as chips in a three-column grid, each one tap to start it. */
export function UnitChips({ lists, onAdd }: { lists: Deck['lists']; onAdd: (slug: string) => void }) {
  const colors = useColors();
  // Three to a row across the screen's 20 dp gutters, 8 dp apart.
  const chip = Math.floor((useWindowDimensions().width - 40 - 16) / 3);
  return (
    <View className="flex-row flex-wrap" style={{ gap: 8 }}>
      {lists.map((l) => (
        <Pressable
          key={l.slug}
          onPress={() => onAdd(l.slug)}
          accessibilityRole="button"
          accessibilityLabel={`Start ${listName(l.title)}, ${l.words.length} words`}
          style={({ pressed }) => ({
            width: chip,
            height: 44,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.lineStrong,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            backgroundColor: pressed ? colors.surface2 : 'transparent',
          })}>
          <Icon as={Plus} size={15} color={colors.ink3} />
          <Text variant="subhead" style={{ color: colors.ink, fontWeight: '500' }}>
            {listName(l.title)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
