import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { BookOpen, Calendar, Layers, ScanLine, User, type LucideIcon } from 'lucide-react-native';
import { Platform, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';

const BAR_HEIGHT = 60;
const SCAN_SIZE = 64;

const ICONS: Record<string, LucideIcon> = { index: Calendar, practice: BookOpen, words: Layers, profile: User };

type AppTabBarProps = BottomTabBarProps & {
  /** Shows the raised Scan button in the middle (students). */
  onScan?: () => void;
};

// The app's tab bar. For students it carries the main action — checking in
// to a lesson — as a raised button in the middle: it sits half above the bar,
// the one thing on the screen that is always within thumb's reach.
export function AppTabBar({ state, descriptors, navigation, insets, onScan }: AppTabBarProps) {
  const colors = useColors();
  const tabs = state.routes.map((route, index) => {
    const { options } = descriptors[route.key];
    const focused = state.index === index;
    const label = typeof options.title === 'string' ? options.title : route.name;
    const color = focused ? colors.ink : colors.ink3;

    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
    };

    return (
      <PressableScale
        key={route.key}
        onPress={onPress}
        pressedScale={0.9}
        style={{ flex: 1 }}
        className="h-full items-center justify-center gap-1"
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={label}>
        <Icon as={ICONS[route.name] ?? Calendar} size={24} color={color} strokeWidth={focused ? 2 : 1.75} />
        <Text variant="caption" maxFontSizeMultiplier={1.2} style={{ color, fontSize: 11, fontWeight: focused ? '700' : '500' }}>
          {label}
        </Text>
      </PressableScale>
    );
  });

  const middle = Math.ceil(tabs.length / 2);
  return (
    <View
      style={{
        height: BAR_HEIGHT + insets.bottom,
        paddingBottom: insets.bottom,
        backgroundColor: colors.bg,
        borderTopWidth: 1,
        borderTopColor: colors.line,
        flexDirection: 'row',
      }}>
      {onScan ? (
        <>
          {/* Two halves of equal width keep the Scan button in the middle
              even when one side has more tabs. */}
          <View style={{ flex: 1, flexDirection: 'row' }}>{tabs.slice(0, middle)}</View>
          <ScanButton onPress={onScan} />
          <View style={{ flex: 1, flexDirection: 'row' }}>{tabs.slice(middle)}</View>
        </>
      ) : (
        tabs
      )}
    </View>
  );
}

function ScanButton({ onPress }: { onPress: () => void }) {
  const colors = useColors();
  return (
    <View style={{ width: SCAN_SIZE + 24, alignItems: 'center' }}>
      {/* The ring in the background colour makes the button look set into
          the bar's edge rather than floating over it. */}
      <View
        style={{
          marginTop: -SCAN_SIZE / 2 - 6,
          padding: 5,
          borderRadius: SCAN_SIZE,
          backgroundColor: colors.bg,
        }}>
        <PressableScale
          onPress={onPress}
          pressedScale={0.9}
          className="items-center justify-center rounded-full bg-accent"
          style={{
            borderRadius: SCAN_SIZE / 2,
            ...Platform.select({
              ios: { shadowColor: '#7a4590', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
              default: { elevation: 8 },
            }),
          }}
          accessibilityRole="button"
          accessibilityLabel="Scan attendance code"
          accessibilityHint="Opens the camera to check in to your lesson">
          <View style={{ width: SCAN_SIZE, height: SCAN_SIZE, alignItems: 'center', justifyContent: 'center' }}>
            <Icon as={ScanLine} size={28} color={colors.onAccent} strokeWidth={2} />
          </View>
        </PressableScale>
      </View>
      <Text variant="caption" maxFontSizeMultiplier={1.2} style={{ color: colors.ink3, fontSize: 11, fontWeight: '500', marginTop: 1 }}>
        Scan
      </Text>
    </View>
  );
}
