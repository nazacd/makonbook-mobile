import { Image, View } from 'react-native';

import { Text } from '@/components/Text';
import { fonts } from '@/design/typography';
import { swatches } from '@/design/colors';

// Students: one of twenty illustrated avatars, chosen by the first letter of
// their first name (A is 01 ... T is 20, then U starts again at 01). Choosing
// your own comes later. Teachers: initials on a palette colour picked from
// their ID, in the same circle a photo will fill once there are photos.
const AVATARS = [
  require('../../assets/avatars/01.webp'),
  require('../../assets/avatars/02.webp'),
  require('../../assets/avatars/03.webp'),
  require('../../assets/avatars/04.webp'),
  require('../../assets/avatars/05.webp'),
  require('../../assets/avatars/06.webp'),
  require('../../assets/avatars/07.webp'),
  require('../../assets/avatars/08.webp'),
  require('../../assets/avatars/09.webp'),
  require('../../assets/avatars/10.webp'),
  require('../../assets/avatars/11.webp'),
  require('../../assets/avatars/12.webp'),
  require('../../assets/avatars/13.webp'),
  require('../../assets/avatars/14.webp'),
  require('../../assets/avatars/15.webp'),
  require('../../assets/avatars/16.webp'),
  require('../../assets/avatars/17.webp'),
  require('../../assets/avatars/18.webp'),
  require('../../assets/avatars/19.webp'),
  require('../../assets/avatars/20.webp'),
];

export function avatarIndex(firstName: string): number {
  const code = firstName.trim().toUpperCase().charCodeAt(0);
  return code >= 65 && code <= 90 ? (code - 65) % 20 : 0;
}

// Background and initials colour, each pair readable.
const TEACHER_COLORS: [string, string][] = [
  [swatches.navy, '#f5efe3'],
  [swatches.terracotta, '#f5efe3'],
  [swatches.mustard, swatches.navy],
  [swatches.sage, swatches.navy],
  [swatches.sky, swatches.navy],
  [swatches.violet, '#ffffff'],
];

type AvatarProps = {
  kind: 'student' | 'teacher';
  firstName: string;
  lastName: string;
  /** Picks the teacher's colour. */
  id: number;
  size?: number;
  /** A teacher's photo, once there are photos; replaces the initials. */
  photoUrl?: string | null;
};

export function Avatar({ kind, firstName, lastName, id, size = 44, photoUrl }: AvatarProps) {
  const circle = { width: size, height: size, borderRadius: size / 2, overflow: 'hidden' as const };
  if (kind === 'student' || photoUrl) {
    return (
      <Image
        source={photoUrl ? { uri: photoUrl } : AVATARS[avatarIndex(firstName)]}
        style={circle}
        accessibilityIgnoresInvertColors
      />
    );
  }
  const [bg, fg] = TEACHER_COLORS[Math.abs(id) % TEACHER_COLORS.length];
  const initials = `${firstName.trim()[0] ?? ''}${lastName.trim()[0] ?? ''}`.toUpperCase();
  return (
    <View style={[circle, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }]}>
      <Text maxFontSizeMultiplier={1} style={{ color: fg, fontFamily: fonts.displaySemiBold, fontSize: size * 0.38 }}>
        {initials}
      </Text>
    </View>
  );
}
