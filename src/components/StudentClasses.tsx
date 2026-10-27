import { router } from 'expo-router';
import { CalendarX } from 'lucide-react-native';
import { Image, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConnectionLine } from '@/components/ConnectionLine';
import { Avatar } from '@/components/Avatar';
import { ClassBlock } from '@/components/ClassBlock';
import { EmptyState } from '@/components/States';
import { SubjectSpill, useSpillLayout } from '@/components/SubjectSpill';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import { fonts } from '@/design/typography';
import { useMyAttendance } from '@/lib/api/attendance';
import { useMe } from '@/lib/api/queries';
import type { Profile } from '@/lib/api/types';
import { useNow } from '@/lib/clock';
import { parseClassName } from '@/lib/groups';
import { describeDay, nextClass, type Occurrence } from '@/lib/schedule';

const LOGO = require('../../assets/makonbook-icon.png');

// The student's home, built around the next lesson: day and time set large,
// then each class as type on the page. (Teachers get TeacherToday.)
export function StudentClasses() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const me = useMe();
  const profile = me.data as Profile; // the signed-in layout only renders with a profile
  const now = useNow();
  const attendance = useMyAttendance();
  const next = nextClass(profile.groups, now);

  return (
    <ScrollView
      className="flex-1 bg-brand"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 48, paddingHorizontal: 20, gap: 64 }}
      refreshControl={
        <RefreshControl
          refreshing={me.isRefetching || attendance.isRefetching}
          onRefresh={() => {
            me.refetch();
            attendance.refetch();
          }}
          tintColor={colors.ink2}
          colors={[colors.ink]}
          progressBackgroundColor={colors.surface}
        />
      }>
      <View style={{ gap: 28 }}>
        <View className="flex-row items-center justify-between" style={{ minHeight: 44 }}>
          <View className="flex-row items-center gap-2" accessibilityRole="header" accessible accessibilityLabel="MakonBook, Classes">
            <Image source={LOGO} style={{ width: 30, height: 30 }} resizeMode="contain" accessibilityIgnoresInvertColors />
            <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: fonts.displayBold, fontSize: 19, color: colors.ink }}>
              MakonBook
            </Text>
          </View>
          <Pressable
            onPress={() => router.navigate('/profile')}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`${profile.first_name} ${profile.last_name}, profile`}>
            <Avatar kind="student" firstName={profile.first_name} lastName={profile.last_name} id={profile.id} />
          </Pressable>
        </View>
        <ConnectionLine />
        {next && <NextClass next={next} now={now} />}
      </View>

      {profile.groups.length === 0 ? (
        <EmptyState icon={CalendarX} title="No classes yet" message="When the office adds you to a group, it shows up here with its schedule." />
      ) : (
        profile.groups.map((group) => (
          <ClassBlock
            key={group.id}
            group={group}
            attendance={attendance.data?.groups.find((g) => g.group_id === group.id)}
            onAttendance={() => router.push({ pathname: '/my-attendance/[groupId]', params: { groupId: String(group.id) } })}
          />
        ))
      )}
    </ScrollView>
  );
}

// Day and time set large, with the class and room beneath. The class's
// objects drift in from the right edge behind it, larger and fainter.
function NextClass({ next, now }: { next: Occurrence; now: number }) {
  const colors = useColors();
  const spill = useSpillLayout();
  const name = parseClassName(next.group.name, next.group.discipline);
  const happening = next.start <= now;
  const what = [name.title, name.teacher].filter(Boolean).join(' · ');
  const where = [next.slot.classroom && `Room ${next.slot.classroom}`, `until ${next.slot.end_time}`].filter(Boolean).join(' · ');

  return (
    <View accessible accessibilityLabel={`${happening ? 'Happening now' : 'Next class'}: ${happening ? `until ${next.slot.end_time}` : `${describeDay(next.start, now)}, ${next.slot.begin_time}`}. ${what}. ${where}`}>
      {name.subject && <SubjectSpill layout={spill} subject={name.subject} level={name.isPrivate ? 'foundation' : (name.level ?? 'foundation')} seed={next.group.id + 7} echo />}
      <View {...spill.keepOut('kicker')} className="self-start">
        <Text variant="subhead" style={{ color: colors.ink2, fontWeight: '500' }}>
          {happening ? 'Happening now' : 'Next class'}
        </Text>
      </View>
      <View {...spill.keepOut('when')} className="flex-row flex-wrap items-baseline self-start" style={{ columnGap: 12, marginTop: 2 }}>
        {happening ? (
          // Two texts, not one nested in the other: a nested Text starts again
          // from the system font on Android and would lose Bitter.
          <>
            <Text variant="largeTitle" style={{ color: colors.ink }}>
              Until
            </Text>
            <Text variant="largeTitle" style={{ color: colors.accent, fontVariant: ['tabular-nums'] }}>
              {next.slot.end_time}
            </Text>
          </>
        ) : (
          <>
            <Text variant="largeTitle" style={{ color: colors.ink }}>
              {describeDay(next.start, now)}
            </Text>
            <Text variant="largeTitle" style={{ color: colors.accent, fontVariant: ['tabular-nums'] }}>
              {next.slot.begin_time}
            </Text>
          </>
        )}
      </View>
      <View {...spill.keepOut('what')} className="self-start" style={{ marginTop: 10 }}>
        <Text variant="callout" style={{ color: colors.ink, fontWeight: '500' }}>
          {what}
        </Text>
      </View>
      {!happening && (
        <View {...spill.keepOut('where')} className="self-start">
          <Text variant="subhead" style={{ color: colors.ink2 }}>
            {where}
          </Text>
        </View>
      )}
    </View>
  );
}
