import { useEffect, useRef, useState } from 'react';
import { UserRound } from 'lucide-react-native';
import { Keyboard, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Notice } from '@/components/Notice';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import * as haptics from '@/design/haptics';
import { ApiError } from '@/lib/api/client';
import { describeParentError } from '@/lib/parent/i18n';
import { TooManyChildrenError, useParent, type SavedChild } from '@/lib/parent/session';

const LENGTH = 5;
const BOXES = Array.from({ length: LENGTH }, (_, i) => i);

// A child's 5-digit parent code, one box per digit, with Enter in a footer
// above the keyboard. It goes as soon as the fifth digit is in. Fills its
// screen (the way in, and adding another child).
export function CodeForm({ onDone }: { onDone?: (kid: SavedChild) => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, addChild } = useParent();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const keyboard = useKeyboardHeight();

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
    // The app draws edge to edge, so the window doesn't shrink for the
    // keyboard: the footer is lifted by the keyboard's height.
    <View className="flex-1" style={{ paddingBottom: keyboard }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24, gap: 26 }}>
        <Text variant="title" style={{ color: colors.ink }} accessibilityRole="header">
          {t.codeTitle}
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
          {wrong && (
            <Text variant="footnote" accessibilityLiveRegion="polite" style={{ color: colors.bad, textAlign: 'center' }}>
              {t.wrongCode}
            </Text>
          )}
        </View>
        <View className="flex-row gap-2.5">
          <Icon as={UserRound} size={18} color={colors.ink3} />
          <Text variant="subhead" className="flex-1" style={{ color: colors.ink2 }}>
            {t.codeIntro}
          </Text>
        </View>
        {problem && <Notice tone="error" message={problem} />}
      </ScrollView>
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: (keyboard ? 0 : insets.bottom) + 12, borderTopWidth: 1, borderTopColor: colors.line }}>
        <Button label={t.enter} onPress={() => submit(code)} loading={busy} disabled={code.length !== LENGTH && !busy} />
      </View>
    </View>
  );
}

/** The open keyboard's height, 0 when it's closed. */
function useKeyboardHeight() {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => setHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return height;
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
  const colors = useColors();
  const input = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const current = Math.min(value.length, LENGTH - 1);

  return (
    <View>
      <View className="flex-row justify-center" style={{ gap: 10 }} importantForAccessibility="no-hide-descendants">
        {BOXES.map((i) => (
          <View
            key={i}
            className="flex-1 items-center justify-center bg-surface"
            style={{
              height: 66,
              maxWidth: 58,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: error ? colors.bad : focused && i === current ? colors.accent : colors.lineStrong,
            }}>
            <Text variant="title" className="text-ink" style={{ fontVariant: ['tabular-nums'] }}>
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
