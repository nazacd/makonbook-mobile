import { Platform } from 'react-native';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { colors } from '@/design/colors';
import { useMe } from '@/lib/api/queries';

// The system tab bar: Liquid Glass on iOS 26 (a translucent layer the content
// scrolls under), Material on Android. Tabs are named for what's in them.
export default function TabsLayout() {
  const teacher = useMe().data?.kind === 'teacher';
  return (
    <NativeTabs
      tintColor={colors.accent}
      iconColor={{ default: colors.secondaryText, selected: colors.accent }}
      labelStyle={{ default: { color: colors.secondaryText }, selected: { color: colors.text } }}
      {...(Platform.OS === 'android' && {
        backgroundColor: colors.surface,
        indicatorColor: 'rgba(139, 92, 246, 0.24)',
        rippleColor: 'rgba(139, 92, 246, 0.16)',
      })}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{teacher ? 'Today' : 'Classes'}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'calendar', selected: 'calendar' }} md="calendar_month" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }}
          md="account_circle"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
