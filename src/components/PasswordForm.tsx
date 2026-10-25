import { useRef, useState } from 'react';
import { ScrollView, View, type TextInput } from 'react-native';

import { Button } from '@/components/Button';
import { Notice } from '@/components/Notice';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { useColors } from '@/design/colors';
import * as haptics from '@/design/haptics';
import { ApiError } from '@/lib/api/client';
import { describeError } from '@/lib/api/errors';
import { useChangePassword } from '@/lib/api/queries';

const MIN_LENGTH = 8;

type PasswordFormProps = {
  /** Replacing the temporary password right after the first sign-in. */
  forced: boolean;
  onDone?: () => void;
};

// Used by two screens: (app)/choose-password (forced, the only screen until it
// is done; the route guard then opens the app on its own) and (app)/password
// (from Profile, a sheet that closes when done).
export function PasswordForm({ forced, onDone }: PasswordFormProps) {
  const colors = useColors();
  const change = useChangePassword();
  const newRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [nextError, setNextError] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  // Validated as people type, not after they press the button.
  const longEnough = next.length >= MIN_LENGTH;
  const matches = confirm !== '' && confirm === next;
  const canSubmit = current !== '' && longEnough && matches && !change.isPending;

  function submit() {
    if (!canSubmit) return;
    setCurrentError(null);
    setNextError(null);
    setProblem(null);
    change.mutate(
      { current_password: current, new_password: next },
      {
        onSuccess: () => {
          haptics.success();
          onDone?.();
        },
        onError: (e) => {
          haptics.error();
          if (e instanceof ApiError && e.code === 'wrong_password') {
            setCurrentError("That isn't your current password.");
            setCurrent('');
          } else if (e instanceof ApiError && e.code === 'weak_password') {
            setNextError(e.message);
            newRef.current?.focus();
          } else {
            setProblem(describeError(e));
          }
        },
      },
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-brand"
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="gap-5 px-5 pb-10 pt-4">
      {forced && (
        <Text variant="body" style={{ color: colors.ink2 }}>
          You signed in with the temporary password. Choose your own to continue — only you will
          know it.
        </Text>
      )}

      <TextField
        label={forced ? 'Temporary password' : 'Current password'}
        hint={forced ? 'The last 4 digits of your phone number.' : undefined}
        error={currentError}
        secure
        value={current}
        onChangeText={(v) => {
          setCurrent(v);
          setCurrentError(null);
        }}
        autoComplete="current-password"
        textContentType="password"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => newRef.current?.focus()}
        autoFocus
      />

      <View className="gap-3">
        <TextField
          ref={newRef}
          label="New password"
          error={nextError}
          secure
          value={next}
          onChangeText={(v) => {
            setNext(v);
            setNextError(null);
          }}
          autoComplete="new-password"
          textContentType="newPassword"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => confirmRef.current?.focus()}
        />
        <TextField
          ref={confirmRef}
          label="Repeat new password"
          secure
          value={confirm}
          onChangeText={setConfirm}
          autoComplete="new-password"
          textContentType="newPassword"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={submit}
        />
        <View className="gap-1.5 pt-1" accessibilityLiveRegion="polite">
          <Requirement met={longEnough} label={`At least ${MIN_LENGTH} characters`} />
          <Requirement met={matches} label="Both passwords match" />
          <Requirement met={null} label="Not your phone number" />
        </View>
      </View>

      {problem && <Notice tone="error" message={problem} />}

      <Button
        label={forced ? 'Save and continue' : 'Change password'}
        onPress={submit}
        loading={change.isPending}
        disabled={!canSubmit && !change.isPending}
      />

      {!forced && (
        <Text variant="footnote" style={{ color: colors.ink3, textAlign: 'center' }}>
          Your other devices will be signed out.
        </Text>
      )}
    </ScrollView>
  );
}

// met: true/false while it can be checked here, null for rules only the
// server checks (it knows the phone number; the app doesn't).
function Requirement({ met, label }: { met: boolean | null; label: string }) {
  const colors = useColors();
  const color = met ? colors.good : colors.ink3;
  return (
    <View
      className="flex-row items-center gap-2"
      accessibilityLabel={met === null ? label : `${label}: ${met ? 'done' : 'not yet'}`}>
      <Text variant="footnote" style={{ color, width: 14, textAlign: 'center' }}>
        {met ? '✓' : '•'}
      </Text>
      <Text variant="footnote" style={{ color: met ? colors.ink : colors.ink2 }}>
        {label}
      </Text>
    </View>
  );
}
