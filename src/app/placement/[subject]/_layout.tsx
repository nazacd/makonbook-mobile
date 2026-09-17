import { Redirect, Stack, useLocalSearchParams } from 'expo-router';

import { SessionProvider } from '@/lib/session-context';
import type { PlacementSubject } from '@/lib/types';

export default function PlacementSubjectLayout() {
  const { subject } = useLocalSearchParams<{ subject: string }>();

  if (subject !== 'math' && subject !== 'english') {
    return <Redirect href="/" />;
  }

  return (
    <SessionProvider subject={subject as PlacementSubject}>
      <Stack screenOptions={{ headerShown: false }} />
    </SessionProvider>
  );
}
