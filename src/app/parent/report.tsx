import { Stack, useLocalSearchParams } from 'expo-router';
import { Check, Clock } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Notice } from '@/components/Notice';
import { Skeleton } from '@/components/States';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import * as haptics from '@/design/haptics';
import { parseClassName } from '@/lib/groups';
import { useChildReports, useChildView, useSendReport } from '@/lib/parent/hooks';
import { dateTimeIn, describeParentError } from '@/lib/parent/i18n';
import { useMarkAnswersSeen } from '@/lib/parent/seen';
import { useParent } from '@/lib/parent/session';
import type { ParentReport } from '@/lib/parent/types';

const MAX = 2000;

// "Report a problem": the message goes to the admins of the child's branch
// (the admin panel and their Telegram chat); their answer shows here. Messages
// already sent read as a conversation, the office's answer under each.
export default function ReportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { child } = useLocalSearchParams<{ child: string }>();
  const { t, lang, kids } = useParent();
  const kid = kids.find((k) => String(k.client_id) === child);
  const groups = useChildView(kid).data?.groups ?? [];
  const reports = useChildReports(kid);
  const send = useSendReport(kid);
  const markSeen = useMarkAnswersSeen(kid);
  const [groupId, setGroupId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [focused, setFocused] = useState(false);

  // Answers shown here count as seen: the home screen's dot goes.
  const list = reports.data?.reports;
  useEffect(() => {
    if (list) markSeen(list);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list]);

  const tooLong = message.length > MAX;
  const canSend = message.trim() !== '' && !tooLong && !send.isPending;

  function submit() {
    if (!canSend) return;
    setSent(false);
    send.mutate(
      { message: message.trim(), group_id: groupId },
      {
        onSuccess: () => {
          haptics.success();
          setMessage('');
          setGroupId(null);
          setSent(true);
        },
        onError: () => haptics.error(),
      },
    );
  }

  return (
    <View className="flex-1 bg-brand">
      <Stack.Screen options={{ title: t.reportTitle }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, gap: 22 }}>
        <Text variant="subhead" style={{ color: colors.ink2 }}>
          {t.reportIntro}
        </Text>

        {groups.length > 0 && (
          <View className="gap-2.5">
            <Text variant="subhead" style={{ color: colors.ink2 }}>
              {t.aboutClass}
            </Text>
            <View className="flex-row flex-wrap gap-2" accessibilityRole="radiogroup">
              {[{ id: null, label: t.general }, ...groups.map((g) => ({ id: g.id as number | null, label: parseClassName(g.name, g.discipline).title }))].map((g) => {
                const on = g.id === groupId;
                return (
                  <Pressable
                    key={g.id ?? 'general'}
                    onPress={() => {
                      if (on) return;
                      haptics.selection();
                      setGroupId(g.id);
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    style={({ pressed }) => ({
                      minHeight: 44,
                      paddingHorizontal: 16,
                      borderRadius: 999,
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: on ? colors.primary : colors.lineStrong,
                      backgroundColor: on ? colors.primary : pressed ? colors.surface2 : 'transparent',
                    })}>
                    <Text variant="subhead" style={{ color: on ? colors.onPrimary : colors.ink2, fontWeight: '500' }}>
                      {g.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <View className="gap-2">
          <View style={{ borderRadius: 14, borderWidth: 1, borderColor: tooLong ? colors.bad : focused ? colors.accent : colors.lineStrong, backgroundColor: colors.surface }}>
            <TextInput
              value={message}
              onChangeText={(v) => {
                setMessage(v);
                setSent(false);
              }}
              multiline
              placeholder={t.messagePlaceholder}
              placeholderTextColor={colors.ink3}
              selectionColor={colors.accent}
              accessibilityLabel={t.message}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              style={[styles.input, { color: colors.ink }, Platform.OS === 'web' && { outlineWidth: 0 }]}
            />
          </View>
          {tooLong && (
            <Text variant="footnote" style={{ color: colors.bad }}>
              {t.messageTooLong}
            </Text>
          )}
        </View>

        {send.isError && <Notice tone="error" message={describeParentError(t, send.error)} />}
        {sent && <Notice tone="success" message={t.sent} />}

        {reports.isPending ? (
          <View className="gap-2">
            <Skeleton width="50%" height={12} />
            <Skeleton height={44} radius={16} />
          </View>
        ) : (
          (list ?? []).length > 0 && (
            <View className="gap-6">
              <Text variant="title3" style={{ color: colors.ink, marginBottom: -10 }} accessibilityRole="header">
                {t.sentReports}
              </Text>
              {list!.map((r) => (
                <Thread key={r.id} report={r} when={dateTimeIn(lang, r.created_at)} labels={{ handled: t.handled, open: t.open, answer: t.answer }} />
              ))}
            </View>
          )
        )}
      </ScrollView>
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 12, borderTopWidth: 1, borderTopColor: colors.line }}>
        <Button label={t.send} onPress={submit} loading={send.isPending} disabled={!canSend && !send.isPending} />
      </View>
    </View>
  );
}

// One message and its answer, as a short conversation: the parent's on the
// right, the office's on the left.
function Thread({ report: r, when, labels }: { report: ParentReport; when: string; labels: { handled: string; open: string; answer: string } }) {
  const colors = useColors();
  const handled = !!r.handled_at;
  return (
    <View className="gap-2.5">
      <View className="flex-row items-center gap-2">
        <Text variant="caption" className="flex-1" numberOfLines={1} style={{ color: colors.ink3, fontWeight: '400' }}>
          {[when, r.group_name && parseClassName(r.group_name).title].filter(Boolean).join(' · ')}
        </Text>
        <Icon as={handled ? Check : Clock} size={14} color={handled ? colors.good : colors.watch} />
        <Text variant="caption" style={{ color: handled ? colors.good : colors.watch }}>
          {handled ? labels.handled : labels.open}
        </Text>
      </View>
      <View style={{ alignSelf: 'flex-end', maxWidth: '86%', backgroundColor: colors.primary, borderRadius: 16, borderBottomRightRadius: 4, paddingHorizontal: 14, paddingVertical: 10 }}>
        <Text variant="subhead" style={{ color: colors.onPrimary, lineHeight: 21 }}>
          {r.message}
        </Text>
      </View>
      {r.reply && (
        <View
          style={{
            alignSelf: 'flex-start',
            maxWidth: '86%',
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: 16,
            borderBottomLeftRadius: 4,
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}>
          <Text variant="caption" style={{ color: colors.accent, marginBottom: 2 }}>
            {labels.answer}
          </Text>
          <Text variant="subhead" style={{ color: colors.ink, lineHeight: 21 }}>
            {r.reply}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 120,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 16,
    textAlignVertical: 'top',
  },
});
