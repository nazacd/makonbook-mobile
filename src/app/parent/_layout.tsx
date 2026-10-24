import { Stack } from 'expo-router';

import { colors } from '@/design/colors';
import { headerOptions, sheetOptions } from '@/design/navigation';

// A parent's screens: read only, for the children added on this phone. Shown
// only while at least one child is saved and no student is signed in (the
// root layout's guards).
export default function ParentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.brand } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="attendance/[groupId]" options={headerOptions} />
      <Stack.Screen name="report" options={sheetOptions} />
      <Stack.Screen name="add" options={sheetOptions} />
    </Stack>
  );
}
