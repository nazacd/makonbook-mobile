import { Stack, useLocalSearchParams } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/components/Button';
import { MarkSheet } from '@/components/MarkSheet';
import { Notice } from '@/components/Notice';
import { RotatingQR } from '@/components/RotatingQR';
import { MARK_COLOR, MARK_LABEL, StateChip } from '@/components/StateChip';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import * as haptics from '@/design/haptics';
import { useAttendanceSession, useFinishSession, useSetMark, type FetchedSession } from '@/lib/api/attendance';
import { describeError } from '@/lib/api/errors';
import type { AttendanceMark } from '@/lib/api/types';
import { useNow } from '@/lib/clock';
import { formatDate, schoolClock, schoolDate } from '@/lib/schedule';

// The teacher's attendance screen: while open, the rotating QR with a live
// count and the class list; once finished, the results, correctable for 24
// hours after the lesson.
export default function AttendanceScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useAttendanceSession(id);
  const finish = useFinishSession(id);
  const setMark = useSetMark(id);
  const now = useNow();
  const [editing, setEditing] = useState<AttendanceMark | null>(null);

  const s = session.data;
  const title = s?.group_name ?? 'Attendance';

  if (!s) {
    return (
      <View className="flex-1 items-center justify-center bg-brand px-6">
        <Stack.Screen options={{ title }} />
        {session.isError ? (
          <Notice tone="error" title="Couldn’t load attendance" message={describeError(session.error)} />
        ) : (
          <ActivityIndicator color={colors.accent} />
        )}
      </View>
    );
  }

  const open = s.status === 'open';
  const editable = now < Date.parse(s.editable_until);
  const checkedIn = s.counts.present + s.counts.late;

  function confirmFinish(session: FetchedSession) {
    const pending = session.counts.pending;
    Alert.alert(
      'Finish attendance?',
      (pending > 0
        ? `${pending} student${pending === 1 ? ' who hasn’t' : 's who haven’t'} checked in will be marked absent. `
        : '') + 'You can still correct marks for 24 hours.',
      [
        { text: 'Keep open', style: 'cancel' },
        {
          text: 'Finish',
          onPress: () =>
            finish.mutate(undefined, {
              onSuccess: () => haptics.success(),
              onError: (e) => {
                haptics.error();
                Alert.alert('Couldn’t finish', describeError(e));
              },
            }),
        },
      ],
    );
  }

  return (
    <>
      <Stack.Screen options={{ title }} />
      {open && <KeepAwake />}
      <ScrollView
        className="flex-1 bg-brand"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-6 px-5 pb-12 pt-4">
        {open && s.qr ? (
          <>
            <View className="flex-row items-end justify-between">
              <View>
                <Text variant="footnote" style={{ color: colors.ink2 }}>
                  Checked in
                </Text>
                <Text
                  variant="largeTitle"
                  className="text-ink"
                  style={{ fontVariant: ['tabular-nums'] }}
                  accessibilityLabel={`${checkedIn} of ${s.counts.total} checked in`}
                  accessibilityLiveRegion="polite">
                  {checkedIn}
                  <Text variant="title2" style={{ color: colors.ink3 }}>
                    {' '}/ {s.counts.total}
                  </Text>
                </Text>
              </View>
              <Text variant="footnote" style={{ color: colors.ink2, textAlign: 'right' }}>
                Late after {schoolClock(Date.parse(s.late_after))}
                {s.counts.late > 0 ? `\n${s.counts.late} late` : ''}
              </Text>
            </View>
            <RotatingQR sessionId={s.id} secret={s.qr.secret} clockOffsetMs={Date.parse(s.qr.server_time) - s.receivedAt} />
            <Text variant="footnote" style={{ color: colors.ink3, textAlign: 'center' }}>
              Students scan this with MakonBook. Someone without a phone? Tap their name to mark them.
            </Text>
          </>
        ) : (
          <View className="gap-3">
            <Text variant="subhead" style={{ color: colors.ink2 }}>
              {formatDate(s.date)} · {schoolClock(Date.parse(s.starts_at))}–{schoolClock(Date.parse(s.ends_at))}
            </Text>
            <View className="flex-row gap-3">
              <Tile label="Present" value={s.counts.present} color={colors.good} />
              <Tile label="Late" value={s.counts.late} color={colors.watch} />
              <Tile label="Absent" value={s.counts.absent} color={colors.bad} />
            </View>
            <Text variant="footnote" style={{ color: colors.ink3 }}>
              {editable
                ? `Tap a name to correct a mark — until ${formatDate(schoolDate(Date.parse(s.editable_until)))}, ${schoolClock(Date.parse(s.editable_until))}.`
                : 'Marks are final. The office can still change them in HolliHop.'}
            </Text>
          </View>
        )}

        <View className="overflow-hidden rounded-2xl bg-surface">
          {s.marks.length === 0 ? (
            <Text variant="subhead" className="p-5" style={{ color: colors.ink2 }}>
              No students on this lesson’s list.
            </Text>
          ) : (
            s.marks.map((m, i) => (
              <StudentRow
                key={m.client_id}
                mark={m}
                first={i === 0}
                // A mark the office corrected stays theirs.
                onPress={editable && m.source !== 'admin' ? () => setEditing(m) : undefined}
              />
            ))
          )}
        </View>

        {open && <Button label="Finish attendance" onPress={() => confirmFinish(s)} loading={finish.isPending} />}
      </ScrollView>

      <MarkSheet
        mark={editing}
        busy={setMark.isPending}
        onClose={() => setEditing(null)}
        onChoose={(state) =>
          editing &&
          setMark.mutate(
            { clientId: editing.client_id, state },
            {
              onSuccess: () => {
                haptics.selection();
                setEditing(null);
              },
              onError: (e) => {
                haptics.error();
                Alert.alert('Couldn’t change the mark', describeError(e));
              },
            },
          )
        }
      />
    </>
  );
}

// Keeps the screen on while the QR is showing.
function KeepAwake() {
  useKeepAwake();
  return null;
}

function Tile({ label, value, color }: { label: string; value: number; color: string }) {
  const colors = useColors();
  return (
    <View className="flex-1 gap-1 rounded-2xl bg-surface p-4">
      <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      <Text variant="title2" className="text-ink" style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
      <Text variant="footnote" style={{ color: colors.ink2 }}>
        {label}
      </Text>
    </View>
  );
}

function StudentRow({ mark, first, onPress }: { mark: AttendanceMark; first: boolean; onPress?: () => void }) {
  const colors = useColors();
  const detail =
    mark.source === 'scan' && mark.scanned_at
      ? `Scanned ${schoolClock(Date.parse(mark.scanned_at))}`
      : mark.source === 'teacher'
        ? 'Marked by teacher'
        : mark.source === 'admin'
          ? 'Corrected by the office'
          : null;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${mark.first_name} ${mark.last_name}, ${MARK_LABEL[mark.state]}`}
      accessibilityHint={onPress ? 'Change this mark' : undefined}
      style={({ pressed }) => ({ backgroundColor: pressed ? colors.surface2 : 'transparent' })}>
      <View className="ml-5" style={first ? undefined : { borderTopWidth: 1, borderTopColor: colors.line }}>
        <View className="min-h-[56px] flex-row items-center gap-3 py-2.5 pr-4">
          <View className="flex-1">
            <Text variant="body" className="text-ink" numberOfLines={1}>
              {mark.first_name} {mark.last_name}
            </Text>
            {detail && (
              <Text variant="caption" style={{ color: colors.ink3 }}>
                {detail}
              </Text>
            )}
          </View>
          <StateChip label={MARK_LABEL[mark.state]} color={colors[MARK_COLOR[mark.state]]} />
        </View>
      </View>
    </Pressable>
  );
}
