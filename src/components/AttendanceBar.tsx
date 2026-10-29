import { Pressable, View } from 'react-native';

import { Text } from '@/components/Text';
import { useColors, type Palette } from '@/design/colors';
import { fonts } from '@/design/typography';

/** Under 70 %, 70–89 %, 90 % and above. */
export function attendanceBand(rate: number): 'bad' | 'watch' | 'good' {
  return rate < 0.7 ? 'bad' : rate < 0.9 ? 'watch' : 'good';
}

const FILL: Record<ReturnType<typeof attendanceBand>, keyof Palette> = { bad: 'fillBad', watch: 'fillWatch', good: 'fillGood' };
const TONE: Record<ReturnType<typeof attendanceBand>, keyof Palette> = { bad: 'bad', watch: 'watch', good: 'good' };

type AttendanceBarProps = {
  /** Lessons attended (present or late) out of lessons recorded, 0–1. */
  rate: number;
  onPress: () => void;
  /** The label and screen-reader wording; parents read them in Uzbek or Russian. */
  label?: string;
  accessibilityLabel?: (pct: number) => string;
  /** Parents: the figure itself above the bar, in its band colour, and the label under it. */
  showFigure?: boolean;
};

// A short horizontal bar under an "Attendance" label: its length and colour
// are the whole message, with no number. The percentage, absences and lesson
// history live on the class screen it opens. Label and bar are one target of
// at least 44 dp. Don't render it before a class has had a lesson.
export function AttendanceBar({ rate, onPress, label = 'Attendance', accessibilityLabel, showFigure = false }: AttendanceBarProps) {
  const colors = useColors();
  const pct = Math.round(Math.max(0, Math.min(1, rate)) * 100);
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ? accessibilityLabel(pct) : `Attendance ${pct}%, opens class details`}
      style={({ pressed }) => ({
        minWidth: 64,
        minHeight: 44,
        paddingTop: 4,
        paddingBottom: 7,
        paddingHorizontal: 4,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 6,
        backgroundColor: pressed ? colors.surface2 : 'transparent',
      })}>
      {showFigure ? (
        <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: fonts.displayBold, fontSize: 20, lineHeight: 24, color: colors[TONE[attendanceBand(rate)]], fontVariant: ['tabular-nums'] }}>
          {pct}%
        </Text>
      ) : (
        <Text variant="caption" maxFontSizeMultiplier={1.2} style={{ color: colors.ink2, fontSize: 11 }}>
          {label}
        </Text>
      )}
      <View style={{ width: showFigure ? 88 : 64, height: 6, borderRadius: 3, backgroundColor: colors.track, overflow: 'hidden' }}>
        <View style={{ width: `${pct}%`, height: 6, borderRadius: 3, backgroundColor: colors[FILL[attendanceBand(rate)]] }} />
      </View>
      {showFigure && (
        <Text variant="caption" maxFontSizeMultiplier={1.2} style={{ color: colors.ink3, fontWeight: '400' }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
