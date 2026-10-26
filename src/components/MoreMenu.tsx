import { Ellipsis, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';

export type MenuItem = { label: string; icon: LucideIcon; destructive?: boolean; onPress: () => void };

// The header's ⋯: the few things a screen can do that don't belong on it.
// Opens a small menu under the button; tap outside to close.
export function MoreMenu({ items }: { items: MenuItem[] }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="More"
        style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
        <Icon as={Ellipsis} size={22} color={colors.ink} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.12)' }} onPress={() => setOpen(false)} accessibilityLabel="Close menu">
          <View
            style={{
              position: 'absolute',
              top: insets.top + 52,
              right: 12,
              minWidth: 220,
              padding: 4,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.line,
              backgroundColor: colors.surface,
              elevation: 8,
              shadowColor: '#000',
              shadowOpacity: 0.18,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
            }}>
            {items.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => {
                  setOpen(false);
                  item.onPress();
                }}
                accessibilityRole="menuitem"
                style={({ pressed }) => ({
                  minHeight: 48,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: pressed ? colors.surface2 : 'transparent',
                })}>
                <Icon as={item.icon} size={18} color={item.destructive ? colors.bad : colors.ink} />
                <Text variant="callout" style={{ color: item.destructive ? colors.bad : colors.ink }}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
