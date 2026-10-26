import { WifiOff } from 'lucide-react-native';
import { ActivityIndicator, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import { useConnection } from '@/lib/api/connection';
import { useNow } from '@/lib/clock';
import { relativeDay, schoolClock } from '@/lib/schedule';

// The one sign of the connection, at the top of a tab: offline (and since
// when the screen's data is), or "Updating…" while a refresh is slow.
// Nothing while all is well. `detail` replaces "updated …" offline.
export function ConnectionLine({ detail, style }: { detail?: string; style?: object }) {
  const colors = useColors();
  const now = useNow();
  const { offline, updating, updatedAt } = useConnection();
  if (!offline && !updating) return null;
  if (updating) {
    return (
      <View className="flex-row items-center gap-2" style={style} accessibilityLiveRegion="polite">
        <ActivityIndicator size="small" color={colors.ink3} />
        <Text variant="subhead" style={{ color: colors.ink3 }}>
          Updating…
        </Text>
      </View>
    );
  }
  const when = updatedAt ? `updated ${relativeDay(updatedAt, now)}, ${schoolClock(updatedAt)}` : null;
  const text = detail ?? when;
  return (
    <View className="flex-row flex-wrap items-center gap-x-2" style={style} accessible accessibilityLiveRegion="polite" accessibilityLabel={`Offline${text ? `, ${text}` : ''}`}>
      <Icon as={WifiOff} size={17} color={colors.watch} />
      <Text variant="subhead" style={{ color: colors.watch, fontWeight: '500' }}>
        Offline
      </Text>
      {text && (
        <Text variant="subhead" style={{ color: colors.ink3 }}>
          · {text}
        </Text>
      )}
    </View>
  );
}
