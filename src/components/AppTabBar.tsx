import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Platform, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { BookIcon, CalendarIcon, PersonIcon, ScanIcon } from '@/components/TabIcons';
import { Text } from '@/components/Text';
import { colors } from '@/design/colors';

const BAR_HEIGHT = 58;
const SCAN_SIZE = 62;

const ICONS: Record<string, typeof CalendarIcon> = { index: CalendarIcon, practice: BookIcon, profile: PersonIcon };

type AppTabBarProps = BottomTabBarProps & {
  /** Shows the raised Scan button in the middle (students). */
  onScan?: () => void;
};

// The app's tab bar. For students it carries the main action — checking in
// to a lesson — as a raised button in the middle: it sits half above the bar,
// the one thing on the screen that is always within thumb's reach.
export function AppTabBar({ state, descriptors, navigation, insets, onScan }: AppTabBarProps) {
  const tabs = state.routes.map((route, index) => {
    const { options } = descriptors[route.key];
    const focused = state.index === index;
    const label = typeof options.title === 'string' ? options.title : route.name;
    const Icon = ICONS[route.name] ?? CalendarIcon;
    const color = focused ? colors.accent : colors.secondaryText;

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
        className="h-full items-center justify-center gap-0.5"
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={label}>
        <Icon color={color} filled={focused} />
        <Text variant="caption" style={{ color, fontWeight: focused ? '600' : '500' }}>
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
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.separator,
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
  return (
    <View style={{ width: SCAN_SIZE + 28, alignItems: 'center' }}>
      {/* The ring in the background colour makes the button look set into
          the bar's edge rather than floating over it. */}
      <View
        style={{
          marginTop: -SCAN_SIZE / 2 - 4,
          padding: 5,
          borderRadius: SCAN_SIZE,
          backgroundColor: colors.brand,
        }}>
        <PressableScale
          onPress={onPress}
          pressedScale={0.9}
          className="items-center justify-center rounded-full bg-accent"
          style={{
            borderRadius: SCAN_SIZE / 2,
            ...Platform.select({
              ios: { shadowColor: colors.accent, shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 4 } },
              default: { elevation: 10 },
            }),
          }}
          accessibilityRole="button"
          accessibilityLabel="Scan attendance code"
          accessibilityHint="Opens the camera to check in to your lesson">
          <View style={{ width: SCAN_SIZE, height: SCAN_SIZE, alignItems: 'center', justifyContent: 'center' }}>
            <ScanIcon color={colors.text} />
          </View>
        </PressableScale>
      </View>
      <Text variant="caption" style={{ color: colors.secondaryText, marginTop: 1 }}>
        Scan
      </Text>
    </View>
  );
}
