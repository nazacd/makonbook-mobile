import { Stack } from 'expo-router';

import { useColors } from '@/design/colors';
import { useHeaderOptions, useSheetOptions } from '@/design/navigation';

// A parent's screens: read only, for the children added on this phone. Shown
// only while at least one child is saved and no student is signed in (the
// root layout's guards).
export default function ParentLayout() {
  const colors = useColors();
  const headerOptions = useHeaderOptions();
  const sheetOptions = useSheetOptions();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="attendance/[groupId]" options={headerOptions} />
      <Stack.Screen name="report" options={sheetOptions} />
      <Stack.Screen name="add" options={sheetOptions} />
    </Stack>
  );
}
