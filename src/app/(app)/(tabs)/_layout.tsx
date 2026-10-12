import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { AppTabBar } from '@/components/AppTabBar';
import { colors } from '@/design/colors';
import { useMe } from '@/lib/api/queries';

// Our own tab bar rather than the system one: students get a raised Scan
// button in the middle, which a native tab bar can't hold.
export default function TabsLayout() {
  const teacher = useMe().data?.kind === 'teacher';
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.brand } }}
      tabBar={(props) => <AppTabBar {...props} onScan={teacher ? undefined : () => router.push('/scan')} />}>
      <Tabs.Screen name="index" options={{ title: teacher ? 'Today' : 'Classes' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
