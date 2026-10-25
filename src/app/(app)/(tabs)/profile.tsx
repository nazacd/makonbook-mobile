import { router } from 'expo-router';
import { AtSign, KeyRound, LogOut, Moon, Share2, Smartphone, Sun } from 'lucide-react-native';
import { Pressable, ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { Icon } from '@/components/Icon';
import { PageRow } from '@/components/PageRow';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import { fonts } from '@/design/typography';
import { appVersion, useMe, useParentCode } from '@/lib/api/queries';
import type { Profile } from '@/lib/api/types';
import { useAppearance } from '@/lib/appearance';
import { useAuth } from '@/lib/auth/session';
import { normalCase } from '@/lib/groups';

// The message the share sheet sends: the code, and where parents enter it, in
// both languages parents' screens use.
function shareMessage(code: string): string {
  return [
    `MakonBook ota-ona kodi: ${code}`,
    'MakonBook’ni oching va birinchi ekranda «Ota-onalar uchun» tugmasini bosing.',
    '',
    `Родительский код MakonBook: ${code}`,
    'Откройте MakonBook и нажмите «Ota-onalar uchun» на первом экране.',
  ].join('\n');
}

// Avatar-led: who you are, the parent code (students), then a few rows.
export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const profile = useMe().data as Profile; // the signed-in layout only renders with a profile
  const { signOut } = useAuth();
  const appearance = useAppearance();
  const parentCode = useParentCode(profile.kind === 'student');
  const name = normalCase(`${profile.first_name} ${profile.last_name}`);

  return (
    <ScrollView
      className="flex-1 bg-brand"
      contentInsetAdjustmentBehavior="automatic"
      // Bottom room for the raised Scan button.
      contentContainerStyle={{ paddingTop: insets.top + 28, paddingBottom: 72, paddingHorizontal: 20, gap: 32 }}>
      <View className="items-center gap-2.5">
        <Avatar kind={profile.kind} firstName={profile.first_name} lastName={profile.last_name} id={profile.id} size={104} />
        <Text variant="title" style={{ color: colors.ink, fontSize: 26, lineHeight: 31, textAlign: 'center' }} accessibilityRole="header">
          {name}
        </Text>
        {profile.username && (
          <Text variant="subhead" style={{ color: colors.ink2, marginTop: -4 }}>
            @{profile.username}
          </Text>
        )}
      </View>

      {profile.kind === 'student' && <ParentCode code={parentCode.data?.code ?? null} failed={parentCode.isError} />}

      <View>
        <PageRow icon={AtSign} label="Username" value={profile.username ? `@${profile.username}` : 'Not set'} onPress={() => router.push('/username')} />
        <PageRow icon={KeyRound} label="Change password" separator onPress={() => router.push('/password')} />
      </View>

      <SegmentedControl
        accessibilityLabel="Appearance"
        value={appearance.mode}
        onChange={appearance.setMode}
        options={[
          { value: 'system', label: 'System', icon: Smartphone },
          { value: 'light', label: 'Light', icon: Sun },
          { value: 'dark', label: 'Dark', icon: Moon },
        ]}
      />

      <View className="gap-3">
        <PageRow icon={LogOut} label="Sign out" destructive onPress={signOut} />
        <Text variant="caption" style={{ color: colors.ink3, textAlign: 'center' }}>
          MakonBook {appVersion}
        </Text>
      </View>
    </ScrollView>
  );
}

// Centred under the name: the label, the five digits large, and a link that
// opens the phone's share sheet.
function ParentCode({ code, failed }: { code: string | null; failed: boolean }) {
  const colors = useColors();
  return (
    <View className="items-center">
      <Text variant="subhead" style={{ color: colors.ink2, fontWeight: '500' }}>
        Parent code
      </Text>
      <Text
        selectable
        maxFontSizeMultiplier={1.2}
        accessibilityLabel={code ? `Parent code ${code.split('').join(' ')}` : undefined}
        // Letter spacing also follows the last digit, so the same space goes
        // before the first to keep the code centred.
        style={{ fontFamily: fonts.displayBold, fontSize: 40, lineHeight: 48, letterSpacing: 9, paddingLeft: 9, color: code ? colors.ink : colors.ink3, fontVariant: ['tabular-nums'] }}>
        {code ?? (failed ? '—' : '·····')}
      </Text>
      <Pressable
        onPress={() => code && Share.share({ message: shareMessage(code) }).catch(() => {})}
        disabled={!code}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel="Share with parents"
        style={({ pressed }) => ({
          minHeight: 44,
          paddingHorizontal: 12,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          opacity: code ? 1 : 0.4,
          backgroundColor: pressed ? colors.surface2 : 'transparent',
        })}>
        <Icon as={Share2} size={18} color={colors.accent} />
        <Text variant="callout" maxFontSizeMultiplier={1.3} style={{ color: colors.accent, fontWeight: '500' }}>
          Share with parents
        </Text>
      </Pressable>
    </View>
  );
}
