import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { Notice } from '@/components/Notice';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import { describeError } from '@/lib/api/errors';
import { useGroupPractice } from '@/lib/practice/hooks';
import { SUBJECT_LABEL } from '@/lib/practice/run';
import type { ServerAttempt } from '@/lib/practice/types';

const scoreOf = (a: ServerAttempt) => a.total ?? Object.values(a.scores)[0]?.score;

// A group's students and their practice tests: the latest score at a glance,
// every attempt one tap away.
export default function GroupPracticeScreen() {
  const colors = useColors();
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const query = useGroupPractice(id);
  const [open, setOpen] = useState<number | null>(null);
  const students = query.data ?? [];
  const active = students.filter((s) => s.attempts.length > 0).length;

  return (
    <ScrollView
      className="flex-1 bg-brand"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-4 px-5 pb-12 pt-4"
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching}
          onRefresh={() => query.refetch()}
          tintColor={colors.accent}
          colors={[colors.accent]}
          progressBackgroundColor={colors.surface}
        />
      }>
      <Stack.Screen options={{ title: name ?? 'Practice' }} />
      {query.isPending ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 48 }} />
      ) : query.isError ? (
        <Notice tone="error" title="Couldn’t load the results" message={describeError(query.error)} />
      ) : students.length === 0 ? (
        <Notice tone="info" message="No students in this group right now." />
      ) : (
        <>
          <Text variant="subhead" style={{ color: colors.ink2 }}>
            {active} of {students.length} students have taken a practice test. Scores are estimates, 200–800 per section.
          </Text>
          <View className="overflow-hidden rounded-3xl bg-surface">
            {students.map((s, i) => {
              const latest = s.attempts[0];
              const expanded = open === s.client_id;
              return (
                <View key={s.client_id} style={i ? { borderTopWidth: 1, borderTopColor: colors.line } : undefined}>
                  <Pressable
                    onPress={() => setOpen(expanded ? null : s.client_id)}
                    disabled={s.attempts.length === 0}
                    accessibilityRole="button"
                    accessibilityState={{ expanded }}
                    style={({ pressed }) => ({ backgroundColor: pressed ? colors.surface2 : 'transparent' })}>
                    <View className="min-h-[60px] flex-row items-center gap-3 px-5 py-3">
                      <View className="flex-1 gap-0.5">
                        <Text variant="body" className="text-ink">
                          {s.last_name} {s.first_name}
                        </Text>
                        <Text variant="footnote" style={{ color: colors.ink3 }}>
                          {latest
                            ? `${s.attempts.length} ${s.attempts.length === 1 ? 'test' : 'tests'} · last ${new Date(latest.finished_at).toLocaleDateString()}`
                            : 'No tests yet'}
                        </Text>
                      </View>
                      {latest && (
                        <Text variant="headline" style={{ color: colors.accent, fontVariant: ['tabular-nums'] }}>
                          {scoreOf(latest)}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                  {expanded &&
                    s.attempts.map((a) => (
                      <View key={a.id} className="flex-row items-center gap-3 px-5 py-2" style={{ backgroundColor: colors.surface2 }}>
                        <View className="flex-1">
                          <Text variant="subhead" className="text-ink">
                            {a.title} · {a.sections.map((x) => SUBJECT_LABEL[x]).join(' and ')}
                          </Text>
                          <Text variant="footnote" style={{ color: colors.ink3 }}>
                            {new Date(a.finished_at).toLocaleDateString()} ·{' '}
                            {a.sections
                              .map((x) => `${x === 'english' ? 'R&W' : 'Math'} ${a.scores[x]?.score} (${a.scores[x]?.raw}/${a.scores[x]?.questions})`)
                              .join(' · ')}
                          </Text>
                        </View>
                        <Text variant="subhead" style={{ color: colors.ink, fontVariant: ['tabular-nums'] }}>
                          {scoreOf(a)}
                        </Text>
                      </View>
                    ))}
                </View>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}
