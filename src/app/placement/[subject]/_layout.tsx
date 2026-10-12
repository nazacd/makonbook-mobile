import { Redirect, Stack, useLocalSearchParams } from 'expo-router';

import { useHomeHref } from '@/lib/navigation';
import { SessionProvider } from '@/lib/session-context';
import type { PlacementSubject } from '@/lib/types';

export default function PlacementSubjectLayout() {
  const { subject } = useLocalSearchParams<{ subject: string }>();
  const home = useHomeHref();

  if (subject !== 'math' && subject !== 'english') {
    return <Redirect href={home} />;
  }

  return (
    <SessionProvider subject={subject as PlacementSubject}>
      <Stack screenOptions={{ headerShown: false }} />
    </SessionProvider>
  );
}
