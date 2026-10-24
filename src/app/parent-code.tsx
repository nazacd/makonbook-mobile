import { Stack } from 'expo-router';
import { ScrollView } from 'react-native';

import { CodeForm } from '@/components/parent/CodeForm';
import { LangSwitch } from '@/components/parent/LangSwitch';
import { useParent } from '@/lib/parent/session';

// A parent's way in: no account, just the child's code. Once a child is
// added this screen is guarded and the router falls back to the parent's home.
export default function ParentCodeScreen() {
  const { t } = useParent();
  return (
    <ScrollView
      className="flex-1 bg-brand"
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="gap-6 px-5 pb-10 pt-4">
      <Stack.Screen options={{ title: t.forParents }} />
      <LangSwitch />
      <CodeForm />
    </ScrollView>
  );
}
