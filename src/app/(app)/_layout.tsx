import { router, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { Button } from '@/components/Button';
import { Notice } from '@/components/Notice';
import { colors } from '@/design/colors';
import { headerOptions, sheetOptions } from '@/design/navigation';
import { describeError } from '@/lib/api/errors';
import { useMe } from '@/lib/api/queries';
import { useAuth } from '@/lib/auth/session';

export default function SignedInLayout() {
  const me = useMe();
  const { signOut } = useAuth();

  // A cold start with a saved session: wait for the profile before showing
  // anything that depends on it. Once loaded it is kept, so a failed refetch
  // later (offline) doesn't take the screen away.
  if (!me.data) {
    return (
      <View className="flex-1 items-center justify-center gap-6 bg-brand px-6">
        {me.isError ? (
          <>
            <Notice tone="error" title="Couldn't load your classes" message={describeError(me.error)} />
            <View className="w-full gap-2">
              <Button label="Try again" onPress={() => me.refetch()} loading={me.isFetching} />
              <Button label="Take the Level Check" variant="plain" onPress={() => router.push('/level-check')} />
              <Button label="Sign out" variant="destructive" onPress={signOut} />
            </View>
          </>
        ) : (
          <ActivityIndicator color={colors.accent} accessibilityLabel="Loading" />
        )}
      </View>
    );
  }

  // Still on the default password (last 4 digits of the phone): the only
  // screen is choose-password. Once it is changed that screen is guarded, and
  // the router falls back to the first available screen, Classes.
  const mustChange = me.data.must_change_password;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.brand } }}>
      <Stack.Protected guard={!mustChange}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="password" options={{ ...sheetOptions, title: 'Change password' }} />
        <Stack.Screen name="username" options={{ ...sheetOptions, title: 'Username' }} />
        <Stack.Screen name="attendance/[id]" options={{ ...headerOptions, title: 'Attendance' }} />
        <Stack.Screen name="my-attendance/[groupId]" options={{ ...headerOptions, title: 'Attendance' }} />
        {/* The scanner rises from the Scan button at the bottom and goes back down. */}
        <Stack.Screen name="scan" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="att/[sessionId]/[window]/[sig]" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      </Stack.Protected>
      <Stack.Protected guard={mustChange}>
        <Stack.Screen
          name="choose-password"
          options={{
            ...headerOptions,
            title: 'Choose a password',
            headerBackVisible: false,
            gestureEnabled: false,
            // Never a dead end: someone on the wrong account can leave.
            headerRight: () => <Button label="Sign out" variant="plain" onPress={signOut} />,
          }}
        />
      </Stack.Protected>
    </Stack>
  );
}
