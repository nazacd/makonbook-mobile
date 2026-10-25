import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListRow } from '@/components/ListRow';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import { appVersion, useMe, useParentCode } from '@/lib/api/queries';
import type { Profile } from '@/lib/api/types';
import { useAppearance } from '@/lib/appearance';
import { useAuth } from '@/lib/auth/session';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const profile = useMe().data as Profile; // the signed-in layout only renders with a profile
  const { signOut } = useAuth();
  const appearance = useAppearance();
  const parentCode = useParentCode(profile.kind === 'student');
  const initials = `${profile.first_name[0] ?? ''}${profile.last_name[0] ?? ''}`.toUpperCase();

  return (
    <ScrollView
      className="flex-1 bg-brand"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 32 }}
      contentContainerClassName="gap-6 px-5">
      <Text variant="largeTitle" className="text-ink" accessibilityRole="header">
        Profile
      </Text>

      <View className="flex-row items-center gap-4">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-accent">
          <Text variant="title3" className="text-ink">
            {initials}
          </Text>
        </View>
        <View className="flex-1 gap-0.5">
          <Text variant="title3" className="text-ink">
            {profile.first_name} {profile.last_name}
          </Text>
          <Text variant="subhead" style={{ color: colors.ink2 }}>
            {profile.kind === 'teacher' ? 'Teacher' : 'Student'}
            {profile.username ? ` · @${profile.username}` : ''}
          </Text>
        </View>
      </View>

      <View className="gap-2">
        <Text variant="footnote" className="px-5" style={{ color: colors.ink2 }}>
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
        <Text variant="footnote" className="px-5" style={{ color: colors.ink3 }}>
          {profile.username
            ? 'You can sign in with your username or your phone number.'
            : 'Set a username to sign in without typing your phone number.'}
        </Text>
      </View>

      {profile.kind === 'student' && (
        <View className="gap-2">
          <Text variant="footnote" className="px-5" style={{ color: colors.ink2 }}>
            FOR YOUR PARENTS
          </Text>
          <View className="flex-row items-center gap-3 rounded-2xl bg-surface px-5 py-4">
            <Text variant="body" className="flex-1 text-ink">
              Parent code
            </Text>
            <Text
              variant="title2"
              selectable
              style={{ color: colors.accent, fontVariant: ['tabular-nums'], letterSpacing: 4 }}
              accessibilityLabel={parentCode.data ? `Parent code ${parentCode.data.code.split('').join(' ')}` : undefined}>
              {parentCode.data?.code ?? (parentCode.isError ? '—' : '·····')}
            </Text>
          </View>
          <Text variant="footnote" className="px-5" style={{ color: colors.ink3 }}>
            Give this code to your parents. With it, they see your classes, schedule and attendance in this app
            (“Ota-onalar uchun” on the first screen). They can’t change anything.
          </Text>
        </View>
      )}

      <View className="gap-2">
        <Text variant="footnote" className="px-5" style={{ color: colors.ink2 }}>
          Appearance
        </Text>
        <SegmentedControl
          accessibilityLabel="Appearance"
          value={appearance.mode}
          onChange={appearance.setMode}
          options={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
      </View>

      <View className="overflow-hidden rounded-2xl bg-surface">
        <ListRow label="Sign out" destructive onPress={signOut} />
      </View>

      <Text variant="footnote" style={{ color: colors.ink3, textAlign: 'center' }}>
        MakonBook {appVersion}
      </Text>
    </ScrollView>
  );
}
