import { Modal, Pressable, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { MARK_COLOR, MARK_LABEL } from '@/components/StateChip';
import { Text } from '@/components/Text';
import { colors } from '@/design/colors';
import type { AttendanceMark } from '@/lib/api/types';

type Choice = 'present' | 'late' | 'absent';
const CHOICES: Choice[] = ['present', 'late', 'absent'];

type MarkSheetProps = {
  mark: AttendanceMark | null; // null = closed
  busy: boolean;
  onChoose: (state: Choice) => void;
  onClose: () => void;
};

// A sheet for correcting one student's mark. It rises from the bottom over a
// dimmed screen (a short, focused task) and goes back down the same way.
export function MarkSheet({ mark, busy, onChoose, onClose }: MarkSheetProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  return (
    <Modal
      visible={mark !== null}
      transparent
      animationType={reduceMotion ? 'fade' : 'slide'}
      onRequestClose={onClose}
      statusBarTranslucent>
      <Pressable className="flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }} onPress={onClose} accessibilityLabel="Close" />
      {mark && (
        <View className="gap-4 rounded-t-3xl bg-surface px-5 pt-5" style={{ paddingBottom: insets.bottom + 16 }}>
          <View className="gap-0.5">
            <Text variant="title3" className="text-white">
              {mark.first_name} {mark.last_name}
            </Text>
            <Text variant="footnote" style={{ color: colors.secondaryText }}>
              Every change is recorded.
            </Text>
          </View>
          <View className="overflow-hidden rounded-2xl" style={{ backgroundColor: colors.brand }}>
            {CHOICES.map((state, i) => {
              const current = mark.state === state;
              return (
                <Pressable
                  key={state}
                  disabled={busy}
                  onPress={() => (current ? onClose() : onChoose(state))}
                  accessibilityRole="button"
                  accessibilityState={{ selected: current, disabled: busy }}
                  style={({ pressed }) => ({ backgroundColor: pressed ? 'rgba(255,255,255,0.06)' : 'transparent' })}>
                  <View
                    className="min-h-[56px] flex-row items-center gap-3 px-4"
                    style={i > 0 ? { borderTopWidth: 1, borderTopColor: colors.separator } : undefined}>
                    <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: MARK_COLOR[state] }} />
                    <Text variant="body" className="flex-1 text-white">
                      {MARK_LABEL[state]}
                    </Text>
                    {current && (
                      <Text variant="headline" style={{ color: colors.accent }}>
                        ✓
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Button label="Cancel" variant="secondary" onPress={onClose} />
        </View>
      )}
    </Modal>
  );
}
