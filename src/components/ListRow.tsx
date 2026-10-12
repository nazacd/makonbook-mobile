import { Pressable, View } from 'react-native';

import { Text } from '@/components/Text';
import { colors } from '@/design/colors';

type ListRowProps = {
  label: string;
  value?: string;
  onPress: () => void;
  destructive?: boolean;
  /** Draws the hairline above this row (every row but the first in a group). */
  separator?: boolean;
};

// A row in a grouped list. Rows highlight the moment a finger lands, like
// system lists, rather than scaling: the whole row width moving would be noise.
export function ListRow({ label, value, onPress, destructive = false, separator = false }: ListRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      style={({ pressed }) => ({ backgroundColor: pressed ? 'rgba(255, 255, 255, 0.06)' : 'transparent' })}>
      <View className="ml-5" style={separator ? { borderTopWidth: 1, borderTopColor: colors.separator } : undefined}>
        <View className="min-h-[52px] flex-row items-center gap-3 py-3 pr-5">
          <Text variant="body" className="flex-1" style={{ color: destructive ? colors.danger : colors.text }}>
            {label}
          </Text>
          {value !== undefined && (
            <Text variant="body" style={{ color: colors.secondaryText }} numberOfLines={1}>
              {value}
            </Text>
          )}
          {!destructive && (
            <Text variant="body" style={{ color: colors.tertiaryText }}>
              ›
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}
