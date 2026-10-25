import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';

type PageRowProps = {
  icon: LucideIcon;
  label: string;
  value?: string;
  onPress: () => void;
  destructive?: boolean;
  /** Draws the hairline above this row (every row but the first in a run). */
  separator?: boolean;
};

// A row set straight on the page, no box: an icon, the label, an optional
// value, and a chevron when it opens a screen. Highlights on press-in like a
// system list row.
export function PageRow({ icon, label, value, onPress, destructive = false, separator = false }: PageRowProps) {
  const colors = useColors();
  const tint = destructive ? colors.bad : colors.ink;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      style={({ pressed }) => ({
        borderTopWidth: separator ? 1 : 0,
        borderTopColor: colors.line,
        backgroundColor: pressed ? colors.surface2 : 'transparent',
        marginHorizontal: -8,
        paddingHorizontal: 8,
        borderRadius: separator ? 0 : 10,
      })}>
      <View className="flex-row items-center gap-3.5" style={{ minHeight: 52 }}>
        <Icon as={icon} size={20} color={destructive ? colors.bad : colors.ink2} />
        <Text variant="body" className="flex-1" style={{ color: tint }}>
          {label}
        </Text>
        {value !== undefined && (
          <Text variant="subhead" style={{ color: colors.ink3 }} numberOfLines={1}>
            {value}
          </Text>
        )}
        {!destructive && <Icon as={ChevronRight} size={18} color={colors.ink3} />}
      </View>
    </Pressable>
  );
}
