import { Stack, useLocalSearchParams } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { Check, CircleDashed, Clock, Lock, Pencil, X, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { FullScreenQR } from '@/components/FullScreenQR';
import { Icon } from '@/components/Icon';
import { MarkSheet } from '@/components/MarkSheet';
import { Notice } from '@/components/Notice';
import { RotatingQR } from '@/components/RotatingQR';
import { MARK_LABEL } from '@/components/StateChip';
import { ErrorState, Skeleton } from '@/components/States';
import { Text } from '@/components/Text';
import { useColors, type Palette } from '@/design/colors';
import * as haptics from '@/design/haptics';
import { fonts } from '@/design/typography';
import { useAttendanceSession, useFinishSession, useSetMark, type FetchedSession } from '@/lib/api/attendance';
import { describeError } from '@/lib/api/errors';
import type { AttendanceMark, MarkState } from '@/lib/api/types';
import { useNow } from '@/lib/clock';
import { normalCase, parseClassName } from '@/lib/groups';
import { formatDate, schoolClock, schoolDate } from '@/lib/schedule';

// Order is information. While open: who hasn't checked in first, then the
// latest arrivals. Once finished: absent, late, then present.
const OPEN_ORDER: Record<MarkState, number> = { pending: 0, late: 1, present: 1, absent: 2 };
const DONE_ORDER: Record<MarkState, number> = { absent: 0, late: 1, present: 2, pending: 3 };

function ordered(marks: AttendanceMark[], open: boolean): AttendanceMark[] {
  const rank = open ? OPEN_ORDER : DONE_ORDER;
  return [...marks].sort((a, b) => {
    const r = rank[a.state] - rank[b.state];
    if (r !== 0 || !open) return r;
    return Date.parse(b.scanned_at ?? '') - Date.parse(a.scanned_at ?? '') || 0;
  });
}

// The teacher's attendance screen: while open, the live count, the rotating
// QR and the class; once finished, the totals, correctable for 24 hours after
// the lesson.
export default function AttendanceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useAttendanceSession(id);
  const finish = useFinishSession(id);
  const setMark = useSetMark(id);
  const now = useNow();
  const [editing, setEditing] = useState<AttendanceMark | null>(null);
  const [markError, setMarkError] = useState<string | null>(null);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [fullScreen, setFullScreen] = useState(false);

  const s = session.data;
  const title = s ? parseClassName(s.group_name).title : 'Attendance';

  if (!s) {
    return (
      <View className="flex-1 bg-brand px-5 pt-4">
        <Stack.Screen options={{ title }} />
        {session.isError ? (
          <ErrorState title="Couldn’t load attendance" message={describeError(session.error)} onRetry={() => session.refetch()} retrying={session.isFetching} />
        ) : (
          <View className="gap-4">
            <Skeleton width={140} height={44} />
            <View className="items-center">
              <Skeleton width={260} height={260} radius={20} />
            </View>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={22} />
            ))}
          </View>
        )}
      </View>
    );
  }

  const open = s.status === 'open';
  const editable = now < Date.parse(s.editable_until);
  // Late counts as attended, here and everywhere in the app.
  const attended = s.counts.present + s.counts.late;
  const clockOffsetMs = s.qr ? Date.parse(s.qr.server_time) - s.receivedAt : 0;

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
          onPress: () => {
            setFinishError(null);
            finish.mutate(undefined, {
              onSuccess: () => haptics.success(),
              onError: (e) => {
                haptics.error();
                setFinishError(describeError(e));
              },
            });
          },
        },
      ],
    );
  }

  return (
    <View className="flex-1 bg-brand">
      <Stack.Screen options={{ title }} />
      {open && <KeepAwake />}
      <ScrollView
        className="flex-1"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32, gap: 24 }}>
        {open && s.qr ? (
          <>
            <View className="flex-row items-end justify-between gap-3">
              <View accessible accessibilityLabel={`${attended} of ${s.counts.total} checked in`} accessibilityLiveRegion="polite">
                <View className="flex-row items-center gap-1.5">
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} />
                  <Text variant="subhead" style={{ color: colors.ink2, fontWeight: '500' }}>
                    Checked in
                  </Text>
                </View>
                <Text style={{ fontFamily: fonts.displayBold, fontSize: 44, lineHeight: 50, color: colors.ink, fontVariant: ['tabular-nums'] }} maxFontSizeMultiplier={1.2}>
                  {attended}
                  <Text style={{ fontFamily: fonts.displaySemiBold, fontSize: 24, color: colors.ink3 }}> / {s.counts.total}</Text>
                </Text>
              </View>
              <View className="flex-row items-center gap-1.5" style={{ paddingBottom: 8 }}>
                <Icon as={Clock} size={15} color={colors.ink2} />
                <Text variant="subhead" style={{ color: colors.ink2 }}>
                  Late after {schoolClock(Date.parse(s.late_after))}
                  {s.counts.late > 0 ? ` · ${s.counts.late} late` : ''}
                </Text>
              </View>
            </View>
            <RotatingQR sessionId={s.id} secret={s.qr.secret} clockOffsetMs={clockOffsetMs} onPress={() => setFullScreen(true)} />
            <Text variant="title3" style={{ color: colors.ink, marginBottom: -12 }} accessibilityRole="header">
              Class
            </Text>
          </>
        ) : (
          <View className="gap-2">
            <Text variant="subhead" style={{ color: colors.ink2 }}>
              {formatDate(s.date)} · {schoolClock(Date.parse(s.starts_at))}–{schoolClock(Date.parse(s.ends_at))}
            </Text>
            <View className="flex-row items-baseline gap-2" accessible accessibilityLabel={`${attended} of ${s.counts.total} attended`}>
              <Text style={{ fontFamily: fonts.displayBold, fontSize: 44, lineHeight: 50, color: colors.ink, fontVariant: ['tabular-nums'] }} maxFontSizeMultiplier={1.2}>
                {attended}
                <Text style={{ fontFamily: fonts.displaySemiBold, fontSize: 24, color: colors.ink3 }}> / {s.counts.total}</Text>
              </Text>
              <Text variant="subhead" style={{ color: colors.ink2 }}>
                attended
              </Text>
            </View>
            {(s.counts.absent > 0 || s.counts.late > 0) && (
              <Text variant="callout" style={{ fontWeight: '600' }}>
                {s.counts.absent > 0 && <Text style={{ color: colors.bad }}>{s.counts.absent} absent</Text>}
                {s.counts.absent > 0 && s.counts.late > 0 && <Text style={{ color: colors.ink3 }}> · </Text>}
                {s.counts.late > 0 && <Text style={{ color: colors.watch }}>{s.counts.late} late</Text>}
              </Text>
            )}
            <View className="flex-row items-center gap-2" style={{ marginTop: 6 }}>
              <Icon as={editable ? Pencil : Lock} size={15} color={colors.ink3} />
              <Text variant="footnote" style={{ color: colors.ink3 }}>
                {editable
                  ? `Correctable until ${formatDate(schoolDate(Date.parse(s.editable_until)))} ${schoolClock(Date.parse(s.editable_until))}`
                  : 'Final'}
              </Text>
            </View>
          </View>
        )}

        <View>
          {s.marks.length === 0 ? (
            <Text variant="subhead" style={{ color: colors.ink2 }}>
              No students on this lesson’s list.
            </Text>
          ) : (
            ordered(s.marks, open).map((m, i) => (
              <StudentRow
                key={m.client_id}
                mark={m}
                open={open}
                first={i === 0}
                // A mark the office corrected stays theirs.
                onPress={editable && m.source !== 'admin' ? () => setEditing(m) : undefined}
              />
            ))
          )}
        </View>
      </ScrollView>

      {open && (
        <View className="gap-3 px-5 pt-3" style={{ paddingBottom: insets.bottom + 12, borderTopWidth: 1, borderTopColor: colors.line }}>
          {finishError && <Notice tone="error" title="Couldn’t finish" message={finishError} />}
          <Button label="Finish attendance" onPress={() => confirmFinish(s)} loading={finish.isPending} />
        </View>
      )}

      {s.qr && (
        <FullScreenQR visible={fullScreen && open} onClose={() => setFullScreen(false)} sessionId={s.id} secret={s.qr.secret} clockOffsetMs={clockOffsetMs} />
      )}

      <MarkSheet
        mark={editing}
        busy={setMark.isPending}
        error={markError}
        onClose={() => {
          setEditing(null);
          setMarkError(null);
        }}
        onChoose={(state) =>
          editing &&
          setMark.mutate(
            { clientId: editing.client_id, state },
            {
              onSuccess: () => {
                haptics.selection();
                setMarkError(null);
                setEditing(null);
              },
              onError: (e) => {
                haptics.error();
                setMarkError(describeError(e));
              },
            },
          )
        }
      />
    </View>
  );
}

// Keeps the screen on while the QR is showing.
function KeepAwake() {
  useKeepAwake();
  return null;
}

// While open every state is shown (grey "Not yet" for who's missing); once
// finished, present is silent and only Late and Absent are marked.
const SHOWN: Record<MarkState, { icon: LucideIcon; tone: keyof Palette; strong: boolean }> = {
  pending: { icon: CircleDashed, tone: 'ink3', strong: false },
  present: { icon: Check, tone: 'ink3', strong: false },
  late: { icon: Clock, tone: 'watch', strong: true },
  absent: { icon: X, tone: 'bad', strong: true },
};

function StudentRow({ mark, open, first, onPress }: { mark: AttendanceMark; open: boolean; first: boolean; onPress?: () => void }) {
  const colors = useColors();
  const detail =
    mark.source === 'scan' && mark.scanned_at
      ? `Scanned ${schoolClock(Date.parse(mark.scanned_at))}`
      : mark.source === 'teacher'
        ? 'Marked by you'
        : mark.source === 'admin'
          ? 'Corrected by the office'
          : null;
  const shown = SHOWN[mark.state];
  const showState = open || mark.state !== 'present';
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${normalCase(`${mark.first_name} ${mark.last_name}`)}, ${MARK_LABEL[mark.state]}`}
      accessibilityHint={onPress ? 'Change this mark' : undefined}
      style={({ pressed }) => ({
        backgroundColor: pressed ? colors.surface2 : 'transparent',
        borderTopWidth: first ? 0 : 1,
        borderTopColor: colors.line,
        marginHorizontal: -8,
        paddingHorizontal: 8,
      })}>
      <View className="flex-row items-center gap-3" style={{ minHeight: 56, paddingVertical: 8 }}>
        <Avatar kind="student" firstName={mark.first_name} lastName={mark.last_name} id={mark.client_id} size={34} />
        <View className="flex-1">
          <Text variant="body" style={{ color: colors.ink }} numberOfLines={1}>
            {normalCase(`${mark.first_name} ${mark.last_name}`)}
          </Text>
          {detail && (
            <Text variant="caption" style={{ color: colors.ink3 }}>
              {detail}
            </Text>
          )}
        </View>
        {showState && (
          <View className="flex-row items-center gap-1.5">
            <Icon as={shown.icon} size={16} color={colors[shown.tone]} strokeWidth={shown.strong ? 2 : 1.75} />
            <Text variant="subhead" style={{ color: shown.strong ? colors[shown.tone] : colors.ink3, fontWeight: shown.strong ? '600' : '400' }}>
              {MARK_LABEL[mark.state]}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
