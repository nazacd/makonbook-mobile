import { router } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Notice } from '@/components/Notice';
import { PressableScale } from '@/components/PressableScale';
import { Text } from '@/components/Text';
import { colors } from '@/design/colors';
import { describeError } from '@/lib/api/errors';
import { useCatalog, useDownloads, useLocalAttempts, useRuns, useUploadAttempts } from '@/lib/practice/hooks';
import { formatBytes, SUBJECT_LABEL } from '@/lib/practice/run';
import type { CatalogTest } from '@/lib/practice/types';

// The student's Practice tab: tests to take (downloaded ones work offline),
// what is in progress, and their latest results.
export function StudentPractice() {
  const insets = useSafeAreaInsets();
  const catalog = useCatalog();
  const downloads = useDownloads();
  const runs = useRuns();
  const attempts = useLocalAttempts();
  const upload = useUploadAttempts(true);

  const downloaded = downloads.data ?? {};
  const inProgress = Object.values(runs.data ?? {});
  // Offline: the tests on the phone still show, from what was downloaded.
  const tests: CatalogTest[] =
    catalog.data ??
    Object.values(downloaded).map((d) => ({
      code: d.code,
      title: d.title,
      english: 0,
      math: 0,
      questions: 0,
      approved: 0,
      version: d.version,
      bytes: d.bytes,
      published_at: null,
    }));
  const open = tests.filter((t) => t.version != null);
  const locked = tests.filter((t) => t.version == null);
  const pending = (attempts.data ?? []).filter((a) => !a.uploaded && !a.rejected).length;

  return (
    <ScrollView
      className="flex-1 bg-brand"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 32 }}
      contentContainerClassName="gap-4 px-5"
      refreshControl={
        <RefreshControl
          refreshing={catalog.isRefetching}
          onRefresh={() => {
            catalog.refetch();
            upload.refetch();
          }}
          tintColor={colors.accent}
          colors={[colors.accent]}
          progressBackgroundColor={colors.surface}
        />
      }>
      <View className="gap-1 pb-2">
        <Text variant="subhead" style={{ color: colors.secondaryText }}>
          SAT practice tests
        </Text>
        <Text variant="largeTitle" className="text-white" accessibilityRole="header">
          Practice
        </Text>
      </View>

      {pending > 0 && (
        <Notice
          tone="info"
          message={`${pending === 1 ? 'One result is' : `${pending} results are`} waiting to be sent to your teachers. It goes as soon as you’re online.`}
        />
      )}

      {inProgress.map((run) => (
        <PressableScale
          key={run.code}
          pressedScale={0.98}
          onPress={() => router.push({ pathname: '/practice/run/[code]', params: { code: run.code } })}
          className="gap-1 rounded-3xl px-5 py-5"
          style={{ backgroundColor: 'rgba(139, 92, 246, 0.16)' }}
          accessibilityRole="button"
          accessibilityHint="Continues the test where you left it">
          <Text variant="caption" style={{ color: colors.accent, textTransform: 'uppercase' }}>
            Continue
          </Text>
          <Text variant="title3" className="text-white">
            {run.title}
          </Text>
          <Text variant="subhead" style={{ color: colors.secondaryText }}>
            {run.sections.map((s) => SUBJECT_LABEL[s]).join(' and ')} · part {run.stage + 1}
          </Text>
        </PressableScale>
      ))}

      {catalog.isPending && !downloads.data ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 48 }} />
      ) : catalog.isError && open.length === 0 ? (
        <Notice tone="error" title="Couldn’t load the tests" message={describeError(catalog.error)} />
      ) : (
        <>
          {catalog.isError && <Notice tone="warning" message="You’re offline: showing the tests on your phone." />}
          {open.length === 0 && (
            <View className="items-center gap-2 px-4 py-12">
              <Text variant="title3" className="text-white">
                No tests yet
              </Text>
              <Text variant="subhead" style={{ color: colors.secondaryText, textAlign: 'center' }}>
                Teachers are checking the questions. Tests appear here one by one as they’re ready.
              </Text>
            </View>
          )}
          {open.length > 0 && (
            <View className="overflow-hidden rounded-3xl bg-surface">
              {open.map((t, i) => {
                const d = downloaded[t.code];
                const last = attempts.data?.find((a) => a.code === t.code);
                const status = !d
                  ? `Download · ${formatBytes(t.bytes ?? 0)}`
                  : d.version < (t.version ?? 0)
                    ? 'On your phone · update available'
                    : 'On your phone';
                return (
                  <TestRow
                    key={t.code}
                    title={t.title}
                    status={status}
                    detail={last ? (last.total ?? Object.values(last.scores)[0]?.score)?.toString() : undefined}
                    separator={i > 0}
                    onPress={() => router.push({ pathname: '/practice/test/[code]', params: { code: t.code } })}
                  />
                );
              })}
            </View>
          )}
          {locked.length > 0 && (
            <View className="gap-2">
              <Text variant="footnote" style={{ color: colors.secondaryText, textTransform: 'uppercase' }} className="px-1">
                Coming soon
              </Text>
              <View className="overflow-hidden rounded-3xl bg-surface">
                {locked.map((t, i) => (
                  <TestRow
                    key={t.code}
                    title={t.title}
                    status={`Being checked · ${percent(t)}%`}
                    separator={i > 0}
                    muted
                  />
                ))}
              </View>
              <Text variant="footnote" style={{ color: colors.tertiaryText }} className="px-1">
                Teachers check every question before a test opens.
              </Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const percent = (t: CatalogTest) => Math.floor((100 * t.approved) / Math.max(1, t.questions));

function TestRow({
  title,
  status,
  detail,
  separator,
  muted,
  onPress,
}: {
  title: string;
  status: string;
  detail?: string;
  separator: boolean;
  muted?: boolean;
  onPress?: () => void;
}) {
  const body = (
    <View className="ml-5" style={separator ? { borderTopWidth: 1, borderTopColor: colors.separator } : undefined}>
      <View className="min-h-[60px] flex-row items-center gap-3 py-3 pr-5">
        <View className="flex-1 gap-0.5">
          <Text variant="body" style={{ color: muted ? colors.secondaryText : colors.text }}>
            {title}
          </Text>
          <Text variant="footnote" style={{ color: colors.tertiaryText }}>
            {status}
          </Text>
        </View>
        {detail && (
          <Text variant="headline" style={{ color: colors.accent, fontVariant: ['tabular-nums'] }}>
            {detail}
          </Text>
        )}
        {onPress && (
          <Text variant="body" style={{ color: colors.tertiaryText }}>
            ›
          </Text>
        )}
      </View>
    </View>
  );
  if (!onPress) return body;
  // Rows highlight the moment a finger lands, like ListRow.
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${status}`}
      style={({ pressed }) => ({ backgroundColor: pressed ? 'rgba(255, 255, 255, 0.06)' : 'transparent' })}>
      {body}
    </Pressable>
  );
}
