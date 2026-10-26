import { router, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { Button } from '@/components/Button';
import { Notice } from '@/components/Notice';
import { useColors } from '@/design/colors';
import { useHeaderOptions, useSheetOptions } from '@/design/navigation';
import { describeError } from '@/lib/api/errors';
import { useMe } from '@/lib/api/queries';
import { useAuth } from '@/lib/auth/session';

export default function SignedInLayout() {
  const colors = useColors();
  const headerOptions = useHeaderOptions();
  const sheetOptions = useSheetOptions();
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
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Protected guard={!mustChange}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="password" options={{ ...sheetOptions, title: 'Change password' }} />
        <Stack.Screen name="username" options={{ ...sheetOptions, title: 'Username' }} />
        <Stack.Screen name="attendance/[id]" options={{ ...headerOptions, title: 'Attendance' }} />
        <Stack.Screen name="my-attendance/[groupId]" options={{ ...headerOptions, title: 'Attendance' }} />
        <Stack.Screen name="practice/test/[code]" options={{ ...headerOptions, title: 'Practice test' }} />
        <Stack.Screen name="practice/result/[id]" options={{ ...headerOptions, title: 'Result' }} />
        <Stack.Screen name="practice/review/[id]/[slot]" options={{ ...headerOptions, title: 'Question' }} />
        <Stack.Screen name="practice/group/[id]" options={{ ...headerOptions, title: 'Practice' }} />
        <Stack.Screen name="practice/new" options={{ ...headerOptions, title: 'New results' }} />
        <Stack.Screen name="practice/history/[code]" options={{ ...headerOptions, title: 'History' }} />
        <Stack.Screen name="vocab/group/[id]" options={{ ...headerOptions, title: 'Words' }} />
        <Stack.Screen name="vocab/study" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
        {/* A test fills the screen; leaving goes through its Home button, which saves and pauses it. */}
        <Stack.Screen name="practice/run/[code]" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
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
