import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Notice } from '@/components/Notice';
import { PressableScale } from '@/components/PressableScale';
import { StateChip } from '@/components/StateChip';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import * as haptics from '@/design/haptics';
import { useChildReports, useChildView, useSendReport } from '@/lib/parent/hooks';
import { dateTimeIn, describeParentError } from '@/lib/parent/i18n';
import { useParent } from '@/lib/parent/session';

const MAX = 2000;

// "Report a problem": the message goes to the admins of the child's branch
// (the admin panel and their Telegram chat); their answer shows here.
export default function ReportScreen() {
  const colors = useColors();
  const { child } = useLocalSearchParams<{ child: string }>();
  const { t, lang, kids } = useParent();
  const kid = kids.find((k) => String(k.client_id) === child);
  const groups = useChildView(kid).data?.groups ?? [];
  const reports = useChildReports(kid);
  const send = useSendReport(kid);
  const [groupId, setGroupId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [focused, setFocused] = useState(false);

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
    <ScrollView
      className="flex-1 bg-brand"
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="gap-5 px-5 pb-12 pt-4">
      <Stack.Screen options={{ title: t.reportTitle }} />
      <Text variant="body" style={{ color: colors.ink2 }}>
        {t.reportIntro}
      </Text>

      {groups.length > 0 && (
        <View className="gap-2">
          <Text variant="footnote" style={{ color: colors.ink2 }}>
            {t.aboutClass}
          </Text>
          <View className="flex-row flex-wrap gap-2" accessibilityRole="radiogroup">
            {[{ id: null, name: t.general }, ...groups].map((g) => {
              const on = g.id === groupId;
              return (
                <PressableScale
                  key={g.id ?? 'general'}
                  className={`min-h-9 items-center justify-center rounded-full px-4 py-2 ${on ? 'bg-primary' : 'bg-surface'}`}
                  onPress={() => {
                    if (on) return;
                    haptics.selection();
                    setGroupId(g.id);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}>
                  <Text variant="subhead" style={{ color: on ? colors.onPrimary : colors.ink2, fontWeight: '600' }}>
                    {g.name}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
        </View>
      )}

      <View className="gap-2">
        <Text variant="footnote" style={{ color: colors.ink2 }}>
          {t.message}
        </Text>
        <View
          className="rounded-2xl bg-surface"
          style={{ borderWidth: 1.5, borderColor: tooLong ? colors.bad : focused ? colors.accent : 'transparent' }}>
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

      <Button label={t.send} onPress={submit} loading={send.isPending} disabled={!canSend && !send.isPending} />

      {(reports.data?.reports.length ?? 0) > 0 && (
        <View className="gap-2 pt-4">
          <Text variant="footnote" className="px-5" style={{ color: colors.ink2, textTransform: 'uppercase' }}>
            {t.sentReports}
          </Text>
          {reports.data!.reports.map((r) => (
            <View key={r.id} className="gap-2 rounded-2xl bg-surface p-4">
              <View className="flex-row items-center justify-between gap-3">
                <Text variant="footnote" className="flex-1" style={{ color: colors.ink3 }}>
                  {[dateTimeIn(lang, r.created_at), r.group_name].filter(Boolean).join(' · ')}
                </Text>
                <StateChip
                  label={r.handled_at ? t.handled : t.open}
                  color={r.handled_at ? colors.good : colors.watch}
                />
              </View>
              <Text variant="body" className="text-ink">
                {r.message}
              </Text>
              {r.reply && (
                <View className="gap-1 pt-2" style={{ borderTopWidth: 1, borderTopColor: colors.line }}>
                  <Text variant="footnote" style={{ color: colors.accent }}>
                    {t.answer}
                  </Text>
                  <Text variant="body" className="text-ink">
                    {r.reply}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
      {reports.isPending && <ActivityIndicator color={colors.accent} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 120,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 17,
    textAlignVertical: 'top',
  },
});
