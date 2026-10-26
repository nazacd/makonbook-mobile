import { ArrowDown, ArrowUp } from 'lucide-react-native';
import { View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import { fonts } from '@/design/typography';

/** "↑160" in green or "↓40" in terracotta, beside a full-test score; nothing when there's no change. */
export function ScoreChange({ change }: { change: number }) {
  const colors = useColors();
  if (!change) return null;
  const color = change > 0 ? colors.good : colors.bad;
  return (
    <View className="flex-row items-center" accessibilityLabel={`${change > 0 ? 'up' : 'down'} ${Math.abs(change)}`}>
      <Icon as={change > 0 ? ArrowUp : ArrowDown} size={13} strokeWidth={2.75} color={color} />
      <Text style={{ fontFamily: fonts.displayBold, fontSize: 14, color, fontVariant: ['tabular-nums'] }} maxFontSizeMultiplier={1.2}>
        {Math.abs(change)}
      </Text>
    </View>
  );
}
