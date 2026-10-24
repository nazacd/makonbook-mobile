import { useRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Notice } from '@/components/Notice';
import { Text } from '@/components/Text';
import { colors } from '@/design/colors';
import * as haptics from '@/design/haptics';
import { ApiError } from '@/lib/api/client';
import { describeParentError } from '@/lib/parent/i18n';
import { TooManyChildrenError, useParent, type SavedChild } from '@/lib/parent/session';

const LENGTH = 5;
const BOXES = Array.from({ length: LENGTH }, (_, i) => i);

// A child's 5-digit parent code, one box per digit. It goes as soon as the
// fifth digit is in.
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
      <View className="gap-2">
        <CodeBoxes
          label={t.codeLabel}
          value={code}
          error={wrong}
          onChange={(digits) => {
            setCode(digits);
            setWrong(false);
            if (digits.length === LENGTH) submit(digits);
          }}
          onSubmit={() => submit(code)}
        />
        <Text
          variant="footnote"
          accessibilityLiveRegion={wrong ? 'polite' : 'none'}
          style={{ color: wrong ? colors.danger : colors.tertiaryText, textAlign: 'center' }}>
          {wrong ? t.wrongCode : t.codeHint}
        </Text>
      </View>
      {problem && <Notice tone="error" message={problem} />}
      <Button label={t.enter} onPress={() => submit(code)} loading={busy} disabled={code.length !== LENGTH && !busy} />
    </View>
  );
}

// Five boxes over one invisible input: the input takes the typing (and the
// keyboard's one-time-code suggestion), the boxes show it. The box the next
// digit goes in is ringed while the input has focus.
function CodeBoxes({
  label,
  value,
  error,
  onChange,
  onSubmit,
}: {
  label: string;
  value: string;
  error: boolean;
  onChange: (digits: string) => void;
  onSubmit: () => void;
}) {
  const input = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const current = Math.min(value.length, LENGTH - 1);

  return (
    <View>
      <View className="flex-row justify-center gap-3" importantForAccessibility="no-hide-descendants">
        {BOXES.map((i) => (
          <View
            key={i}
            className="h-16 max-w-16 flex-1 items-center justify-center rounded-2xl bg-surface"
            style={{
              borderWidth: 1.5,
              borderColor: error ? colors.danger : focused && i === current ? colors.accent : 'transparent',
            }}>
            <Text variant="title" className="text-white" style={{ fontVariant: ['tabular-nums'] }}>
              {value[i] ?? ''}
            </Text>
          </View>
        ))}
      </View>
      <TextInput
        ref={input}
        value={value}
        onChangeText={(v) => onChange(v.replace(/[^0-9]/g, '').slice(0, LENGTH))}
        accessibilityLabel={label}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={LENGTH}
        autoFocus
        caretHidden
        returnKeyType="go"
        onSubmitEditing={onSubmit}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        selectionColor="transparent"
        style={[styles.input, Platform.OS === 'web' && { outlineWidth: 0 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Over the boxes, so a tap anywhere on them focuses it; never seen.
  input: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, opacity: 0, color: 'transparent' },
});
