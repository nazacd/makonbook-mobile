import { useRef, useState } from 'react';
import { ScrollView, View, type TextInput } from 'react-native';

import { Button } from '@/components/Button';
import { Notice } from '@/components/Notice';
import { TextField } from '@/components/TextField';
import { Text } from '@/components/Text';
import { colors } from '@/design/colors';
import * as haptics from '@/design/haptics';
import { ApiError } from '@/lib/api/client';
import { describeError } from '@/lib/api/errors';
import { useAuth } from '@/lib/auth/session';

export default function SignInScreen() {
  const { signIn } = useAuth();
  const passwordRef = useRef<TextInput>(null);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [wrongCredentials, setWrongCredentials] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const canSubmit = login.trim() !== '' && password !== '' && !busy;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setWrongCredentials(false);
    setProblem(null);
    try {
      await signIn(login, password);
      haptics.success();
      // The route guard in the root layout moves to the app on its own.
    } catch (e) {
      haptics.error();
      if (e instanceof ApiError && e.code === 'invalid_credentials') {
        setWrongCredentials(true);
        setPassword('');
        passwordRef.current?.focus();
      } else {
        setProblem(describeError(e));
      }
      setBusy(false);
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-brand"
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="gap-5 px-5 pb-10 pt-4">
      <Text variant="body" style={{ color: colors.secondaryText }}>
        Use the phone number the office has for you, or your username if you set one.
      </Text>

      <TextField
        label="Phone number or username"
        value={login}
        onChangeText={(v) => {
          setLogin(v);
          setWrongCredentials(false);
        }}
        placeholder="90 123 45 67"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        textContentType="username"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordRef.current?.focus()}
        autoFocus
      />

      <TextField
        ref={passwordRef}
        label="Password"
        secure
        value={password}
        onChangeText={(v) => {
          setPassword(v);
          setWrongCredentials(false);
        }}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
        error={wrongCredentials ? "That phone number or password isn't right." : null}
        hint="First time? Your password is the last 4 digits of your phone number."
      />

      {problem && <Notice tone="error" message={problem} />}

      <View className="pt-1">
        <Button label="Sign in" onPress={submit} loading={busy} disabled={!canSubmit && !busy} />
      </View>

      <Text variant="footnote" style={{ color: colors.tertiaryText, textAlign: 'center' }}>
        Forgot your password, or your number changed? Ask the office to reset it.
      </Text>
    </ScrollView>
  );
}
