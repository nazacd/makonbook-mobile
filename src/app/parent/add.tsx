import { router, Stack } from 'expo-router';
import { ScrollView } from 'react-native';

import { CodeForm } from '@/components/parent/CodeForm';
import { useParent } from '@/lib/parent/session';

// Another child on the same phone (a sheet from the parent's home).
export default function AddChildScreen() {
  const { t } = useParent();
  return (
    <ScrollView
      className="flex-1 bg-brand"
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="gap-6 px-5 pb-10 pt-4">
      <Stack.Screen options={{ title: t.addChildTitle }} />
      <CodeForm onDone={() => router.back()} />
    </ScrollView>
  );
}
