import { View } from 'react-native';

import { SubjectSpill, useSpillLayout } from '@/components/SubjectSpill';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import { parseClassName, roomNumber } from '@/lib/groups';
import { describeDay, type Occurrence } from '@/lib/schedule';

/** The block's words; parents read them in Uzbek or Russian. */
export type NextClassLabels = {
  happening: string;
  next: string;
  /** "Today", "Tomorrow" or the weekday, for a class starting at `start`. */
  day: (start: number, now: number) => string;
  /** "until 20:00": its time is set in the accent, the words around it in ink. */
  until: (time: string) => string;
  room: (room: string) => string;
};

const ENGLISH: NextClassLabels = {
  happening: 'Happening now',
  next: 'Next class',
  day: describeDay,
  until: (time) => `until ${time}`,
  room: (room) => `Room ${room}`,
};

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Day and time set large, with the class and room beneath. The class's
// objects drift in from the right edge behind it, larger and fainter.
export function NextClass({ next, now, labels = ENGLISH }: { next: Occurrence; now: number; labels?: NextClassLabels }) {
  const colors = useColors();
  const spill = useSpillLayout();
  const name = parseClassName(next.group.name, next.group.discipline);
  const happening = next.start <= now;
  const what = [name.title, name.teacher].filter(Boolean).join(' · ');
  const where = [next.slot.classroom && labels.room(roomNumber(next.slot.classroom)), labels.until(next.slot.end_time)].filter(Boolean).join(' · ');
  // "Until 20:00" / "20:00 gacha" / "до 20:00": the words around the time, set apart.
  const [before, after] = capital(labels.until(next.slot.end_time)).split(next.slot.end_time) as [string, string?];

  return (
    <View accessible accessibilityLabel={`${happening ? labels.happening : labels.next}: ${happening ? labels.until(next.slot.end_time) : `${labels.day(next.start, now)}, ${next.slot.begin_time}`}. ${what}. ${where}`}>
      {name.subject && <SubjectSpill layout={spill} subject={name.subject} level={name.isPrivate ? 'foundation' : (name.level ?? 'foundation')} seed={next.group.id + 7} echo />}
      <View {...spill.keepOut('kicker')} className="self-start">
        <Text variant="subhead" style={{ color: colors.ink2, fontWeight: '500' }}>
          {happening ? labels.happening : labels.next}
        </Text>
      </View>
      {/* Separate texts, not nested: a nested Text starts again from the system font on Android and would lose Bitter. */}
      <View {...spill.keepOut('when')} className="flex-row flex-wrap items-baseline self-start" style={{ columnGap: 12, marginTop: 2 }}>
        {happening ? (
          <>
            {before.trim() !== '' && (
              <Text variant="largeTitle" style={{ color: colors.ink }}>
                {before.trim()}
              </Text>
            )}
            <Text variant="largeTitle" style={{ color: colors.accent, fontVariant: ['tabular-nums'] }}>
              {next.slot.end_time}
            </Text>
            {!!after?.trim() && (
              <Text variant="largeTitle" style={{ color: colors.ink }}>
                {after.trim()}
              </Text>
            )}
          </>
        ) : (
          <>
            <Text variant="largeTitle" style={{ color: colors.ink }}>
              {labels.day(next.start, now)}
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
