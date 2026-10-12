import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListRow } from '@/components/ListRow';
import { Text } from '@/components/Text';
import { colors } from '@/design/colors';
import { appVersion, useMe } from '@/lib/api/queries';
import type { Profile } from '@/lib/api/types';
import { useAuth } from '@/lib/auth/session';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const profile = useMe().data as Profile; // the signed-in layout only renders with a profile
  const { signOut } = useAuth();
  const initials = `${profile.first_name[0] ?? ''}${profile.last_name[0] ?? ''}`.toUpperCase();

  return (
    <ScrollView
      className="flex-1 bg-brand"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 32 }}
      contentContainerClassName="gap-6 px-5">
      <Text variant="largeTitle" className="text-white" accessibilityRole="header">
        Profile
      </Text>

      <View className="flex-row items-center gap-4">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-accent">
          <Text variant="title3" className="text-white">
            {initials}
          </Text>
        </View>
        <View className="flex-1 gap-0.5">
          <Text variant="title3" className="text-white">
            {profile.first_name} {profile.last_name}
          </Text>
          <Text variant="subhead" style={{ color: colors.secondaryText }}>
            {profile.kind === 'teacher' ? 'Teacher' : 'Student'}
            {profile.username ? ` · @${profile.username}` : ''}
          </Text>
        </View>
      </View>

      <View className="gap-2">
        <Text variant="footnote" className="px-5" style={{ color: colors.secondaryText }}>
          SIGNING IN
        </Text>
        <View className="overflow-hidden rounded-2xl bg-surface">
          <ListRow
            label="Username"
            value={profile.username ?? 'Not set'}
            onPress={() => router.push('/username')}
          />
          <ListRow label="Change password" separator onPress={() => router.push('/password')} />
        </View>
        <Text variant="footnote" className="px-5" style={{ color: colors.tertiaryText }}>
          {profile.username
            ? 'You can sign in with your username or your phone number.'
            : 'Set a username to sign in without typing your phone number.'}
        </Text>
      </View>

      <View className="overflow-hidden rounded-2xl bg-surface">
        <ListRow label="Sign out" destructive onPress={signOut} />
      </View>

      <Text variant="footnote" style={{ color: colors.tertiaryText, textAlign: 'center' }}>
        MakonBook {appVersion}
      </Text>
    </ScrollView>
  );
}
