import { router, Stack } from 'expo-router';
import { View } from 'react-native';

import { CodeForm } from '@/components/parent/CodeForm';
import { useParent } from '@/lib/parent/session';

// Another child on the same phone (a sheet from the parent's home).
export default function AddChildScreen() {
  const { t } = useParent();
  return (
    <View className="flex-1 bg-brand">
      <Stack.Screen options={{ title: t.addChildTitle }} />
      <CodeForm onDone={() => router.back()} />
    </View>
  );
}
