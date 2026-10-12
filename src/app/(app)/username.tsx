import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';

import { Button } from '@/components/Button';
import { Notice } from '@/components/Notice';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { colors } from '@/design/colors';
import * as haptics from '@/design/haptics';
import { ApiError } from '@/lib/api/client';
import { describeError } from '@/lib/api/errors';
import { useMe, useSetUsername } from '@/lib/api/queries';

// Same rules as the API (normalizeUsername in makonbook-api): starts with a
// letter so it can't be mistaken for a phone number, and doesn't end in a dot.
const PATTERN = /^[a-z][a-z0-9_.]{1,28}[a-z0-9_]$/;

function problemWith(value: string): string | null {
  if (value === '') return null;
  if (!/^[a-z]/.test(value)) return 'Start with a letter.';
  if (/[^a-z0-9_.]/.test(value)) return 'Use only letters, numbers, dots and underscores.';
  if (value.length < 3) return 'At least 3 characters.';
  if (value.length > 30) return 'At most 30 characters.';
  if (value.endsWith('.')) return "Can't end with a dot.";
  return null;
}

export default function UsernameScreen() {
  const currentUsername = useMe().data?.username ?? '';
  const save = useSetUsername();
  const [value, setValue] = useState(currentUsername);
  const [serverError, setServerError] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const normalized = value.trim().toLowerCase();
  const inlineError = problemWith(normalized);
  const canSave = PATTERN.test(normalized) && normalized !== currentUsername && !save.isPending;

  function submit() {
    if (!canSave) return;
    setServerError(null);
    setProblem(null);
    save.mutate(normalized, {
      onSuccess: () => {
        haptics.success();
        router.back();
      },
      onError: (e) => {
        haptics.error();
        if (e instanceof ApiError && e.code === 'username_taken') {
          setServerError('Someone already has this username. Try another.');
        } else if (e instanceof ApiError && e.code === 'invalid_username') {
          setServerError(e.message);
        } else {
          setProblem(describeError(e));
        }
      },
    });
  }

  return (
    <ScrollView
      className="flex-1 bg-brand"
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="gap-5 px-5 pb-10 pt-4">
      <Text variant="body" style={{ color: colors.secondaryText }}>
        A username is optional. With one, you can sign in without typing your phone number — the
        phone number keeps working too.
      </Text>

      <TextField
        label="Username"
        value={value}
        onChangeText={(v) => {
          setValue(v);
          setServerError(null);
        }}
        placeholder="e.g. sat.student"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username-new"
        textContentType="username"
        maxLength={30}
        returnKeyType="done"
        onSubmitEditing={submit}
        error={serverError ?? inlineError}
        hint="3–30 characters: letters, numbers, dots and underscores."
        autoFocus
      />

      {problem && <Notice tone="error" message={problem} />}

      <Button label="Save" onPress={submit} loading={save.isPending} disabled={!canSave && !save.isPending} />
    </ScrollView>
  );
}
