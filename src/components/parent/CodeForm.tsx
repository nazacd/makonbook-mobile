import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Notice } from '@/components/Notice';
import { TextField } from '@/components/TextField';
import { Text } from '@/components/Text';
import { colors } from '@/design/colors';
import * as haptics from '@/design/haptics';
import { ApiError } from '@/lib/api/client';
import { describeParentError } from '@/lib/parent/i18n';
import { TooManyChildrenError, useParent, type SavedChild } from '@/lib/parent/session';

// A child's 5-digit parent code. It goes as soon as the fifth digit is in.
export function CodeForm({ onDone }: { onDone?: (kid: SavedChild) => void }) {
  const { t, addChild } = useParent();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function submit(value: string) {
    if (busy || !/^[0-9]{5}$/.test(value)) return;
    setBusy(true);
    setWrong(false);
    setProblem(null);
    try {
      const kid = await addChild(value);
      haptics.success();
      onDone?.(kid);
    } catch (e) {
      haptics.error();
      if (e instanceof ApiError && e.code === 'invalid_parent_code') {
        setWrong(true);
        setCode('');
      } else {
        setProblem(e instanceof TooManyChildrenError ? t.tooManyChildren : describeParentError(t, e));
      }
      setBusy(false);
    }
  }

  return (
    <View className="gap-5">
      <Text variant="body" style={{ color: colors.secondaryText }}>
        {t.codeIntro}
      </Text>
      <TextField
        label={t.codeLabel}
        value={code}
        onChangeText={(v) => {
          const digits = v.replace(/[^0-9]/g, '').slice(0, 5);
          setCode(digits);
          setWrong(false);
          if (digits.length === 5) submit(digits);
        }}
        placeholder="•••••"
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="off"
        maxLength={5}
        autoFocus
        returnKeyType="go"
        onSubmitEditing={() => submit(code)}
        error={wrong ? t.wrongCode : null}
        hint={t.codeHint}
      />
      {problem && <Notice tone="error" message={problem} />}
      <Button label={t.enter} onPress={() => submit(code)} loading={busy} disabled={code.length !== 5 && !busy} />
    </View>
  );
}
