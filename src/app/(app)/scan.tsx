import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { Calendar, Camera, X } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { CheckInResult } from '@/components/CheckInResult';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import * as haptics from '@/design/haptics';
import { useMe } from '@/lib/api/queries';
import { parseAttendanceLink, type ScannedCode } from '@/lib/attendance/code';
import { useNow } from '@/lib/clock';
import { parseClassName } from '@/lib/groups';
import { nextClass } from '@/lib/schedule';

const FRAME = 250;
// Over the live camera, in both themes.
const LIGHT = '#fffcf6';
const MUSTARD = '#e0b24e';
const OPENS_BEFORE_MS = 15 * 60_000;

type Hint = 'scan' | 'wrong' | 'changed';

// Opened from the Scan button in the tab bar; rises from the bottom, where
// the button is, and goes back down the same way.
export default function ScanScreen() {
  const colors = useColors();
  const [permission, requestPermission] = useCameraPermissions();
  const [code, setCode] = useState<ScannedCode | null>(null);
  const [wrongCode, setWrongCode] = useState<string | null>(null);
  const [hint, setHint] = useState<Hint>('scan');
  const close = () => router.back();

  if (code) {
    return (
      <CheckInResult
        code={code}
        onDone={close}
        onScanAgain={() => setCode(null)}
        onCodeChanged={() => {
          haptics.error();
          setHint('changed');
          setCode(null);
        }}
      />
    );
  }

  function onScanned({ data }: BarcodeScanningResult) {
    const parsed = parseAttendanceLink(data);
    if (parsed) {
      setCode(parsed); // the camera unmounts: no second scan of the same code
    } else if (data !== wrongCode) {
      // Say so once per foreign code, not on every frame it stays in view.
      haptics.error();
      setWrongCode(data);
      setHint('wrong');
    }
  }

  if (permission && !permission.granted) {
    return (
      <View className="flex-1 bg-brand">
        <SafeAreaView style={{ flex: 1 }}>
          <View className="flex-1 px-5">
            <CloseButton onPress={close} tint={colors.ink} background={colors.surface2} />
            <View className="flex-1 items-center justify-center gap-3">
              <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                <Icon as={Camera} size={38} color={colors.ink} />
              </View>
              <Text variant="title" style={{ color: colors.ink, textAlign: 'center' }} accessibilityRole="header">
                Allow the camera
              </Text>
              <Text variant="body" style={{ color: colors.ink2, textAlign: 'center' }}>
                Only to read your teacher’s code. Nothing is recorded.
              </Text>
            </View>
            <View className="pb-4">
              {permission.canAskAgain ? (
                <Button label="Allow camera" onPress={requestPermission} />
              ) : (
                <Button label="Open Settings" onPress={() => Linking.openSettings()} />
              )}
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const hintText =
    hint === 'changed' ? 'Code changed, scan again' : hint === 'wrong' ? 'That isn’t a MakonBook attendance code.' : 'Scan the code on your teacher’s screen';

  return (
    <View className="flex-1" style={{ backgroundColor: '#000' }}>
      {permission?.granted && (
        <CameraView
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={onScanned}
        />
      )}
      <SafeAreaView style={{ flex: 1 }}>
        <View className="flex-1 px-5 pb-6">
          <CloseButton onPress={close} tint={LIGHT} background="rgba(0,0,0,0.42)" />
          {permission?.granted && (
            <>
              <View className="flex-1 items-center justify-center gap-7">
                <Corners />
                <Animated.View key={hint} entering={FadeIn.duration(150)}>
                  <Text
                    variant="headline"
                    accessibilityLiveRegion="polite"
                    style={{
                      color: hint === 'scan' ? LIGHT : MUSTARD,
                      textAlign: 'center',
                      textShadowColor: 'rgba(0,0,0,0.6)',
                      textShadowRadius: 8,
                      textShadowOffset: { width: 0, height: 1 },
                    }}>
                    {hintText}
                  </Text>
                </Animated.View>
              </View>
              <LessonPill />
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

function CloseButton({ onPress, tint, background }: { onPress: () => void; tint: string; background: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Close"
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        marginTop: 8,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: background,
        opacity: pressed ? 0.7 : 1,
      })}>
      <Icon as={X} size={22} color={tint} strokeWidth={2.25} />
    </Pressable>
  );
}

// Names the lesson being checked into, while one is on or about to start.
function LessonPill() {
  const groups = useMe().data?.groups ?? [];
  const now = useNow();
  const next = nextClass(groups, now);
  if (!next || next.start - OPENS_BEFORE_MS > now) return null;
  const name = parseClassName(next.group.name, next.group.discipline);
  return (
    <View
      className="flex-row items-center gap-2 self-center"
      style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.45)' }}
      accessible
      accessibilityLabel={`${name.title}, until ${next.slot.end_time}`}>
      <Icon as={Calendar} size={16} color={LIGHT} />
      <Text variant="subhead" style={{ color: LIGHT, fontWeight: '500' }}>
        {name.title} · until {next.slot.end_time}
      </Text>
    </View>
  );
}

// Corner marks showing where to hold the code.
function Corners() {
  const arm = 40;
  const side = { borderColor: LIGHT, position: 'absolute' as const, width: arm, height: arm };
  return (
    <View style={{ width: FRAME, height: FRAME }} accessible={false}>
      <View style={{ ...side, top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 18 }} />
      <View style={{ ...side, top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 18 }} />
      <View style={{ ...side, bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 18 }} />
      <View style={{ ...side, bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 18 }} />
    </View>
  );
}
