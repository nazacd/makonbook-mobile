import { Clock, X, type LucideIcon } from 'lucide-react-native';
import { Modal, Pressable, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Notice } from '@/components/Notice';
import { MARK_LABEL } from '@/components/StateChip';
import { Text } from '@/components/Text';
import { useColors, type Palette } from '@/design/colors';
import type { AttendanceMark } from '@/lib/api/types';
import { normalCase } from '@/lib/groups';

type Choice = 'present' | 'late' | 'absent';
const CHOICES: { state: Choice; icon?: LucideIcon; tone?: keyof Palette }[] = [
  { state: 'present' },
  { state: 'late', icon: Clock, tone: 'watch' },
  { state: 'absent', icon: X, tone: 'bad' },
];

type MarkSheetProps = {
  mark: AttendanceMark | null; // null = closed
  busy: boolean;
  /** Why the last change didn't go through, shown in the sheet. */
  error?: string | null;
  onChoose: (state: Choice) => void;
  onClose: () => void;
};

// A sheet for correcting one student's mark. It rises from the bottom over a
// dimmed screen (a short, focused task) and goes back down the same way. The
// current mark is the highlighted row with a filled radio dot.
export function MarkSheet({ mark, busy, error, onChoose, onClose }: MarkSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  return (
    <Modal
      visible={mark !== null}
      transparent
      animationType={reduceMotion ? 'fade' : 'slide'}
      onRequestClose={onClose}
      statusBarTranslucent>
      <Pressable className="flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={onClose} accessibilityLabel="Close" />
      {mark && (
        <View className="gap-4 bg-surface px-5 pt-3" style={{ paddingBottom: insets.bottom + 16, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
          <View className="self-center" style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.lineStrong }} />
          <View className="flex-row items-center gap-3">
            <Avatar kind="student" firstName={mark.first_name} lastName={mark.last_name} id={mark.client_id} />
            <View className="flex-1">
              <Text variant="title3" style={{ color: colors.ink }} numberOfLines={1}>
                {normalCase(`${mark.first_name} ${mark.last_name}`)}
              </Text>
              <Text variant="footnote" style={{ color: colors.ink3 }}>
                {MARK_LABEL[mark.state]}
              </Text>
            </View>
          </View>
          <View accessibilityRole="radiogroup" className="gap-0.5">
            {CHOICES.map(({ state, icon, tone }) => {
              const current = mark.state === state;
              return (
                <Pressable
                  key={state}
                  disabled={busy}
                  onPress={() => (current ? onClose() : onChoose(state))}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: current, disabled: busy }}
                  accessibilityLabel={MARK_LABEL[state]}
                  style={({ pressed }) => ({
                    minHeight: 56,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    marginHorizontal: -12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    backgroundColor: current ? colors.surface2 : pressed ? colors.line : 'transparent',
                  })}>
                  {icon && tone ? <Icon as={icon} size={20} color={colors[tone]} /> : <View style={{ width: 20 }} />}
                  <Text variant="body" className="flex-1" style={{ color: colors.ink, fontWeight: current ? '600' : '400' }}>
                    {MARK_LABEL[state]}
                  </Text>
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      borderWidth: 2,
                      borderColor: current ? colors.accent : colors.lineStrong,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    {current && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent }} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
          {error && <Notice tone="error" title="Couldn’t change the mark" message={error} />}
          <Button label="Cancel" variant="secondary" onPress={onClose} />
        </View>
      )}
    </Modal>
  );
}
