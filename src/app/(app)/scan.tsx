import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { CheckInResult } from '@/components/CheckInResult';
import { Text } from '@/components/Text';
import { colors } from '@/design/colors';
import * as haptics from '@/design/haptics';
import { parseAttendanceLink, type ScannedCode } from '@/lib/attendance/code';

const FRAME = 260;

// Opened from the Scan button in the tab bar; rises from the bottom, where
// the button is, and goes back down the same way.
export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [code, setCode] = useState<ScannedCode | null>(null);
  const [wrongCode, setWrongCode] = useState<string | null>(null);
  const close = () => router.back();

  if (code) {
    return <CheckInResult code={code} onDone={close} onScanAgain={() => setCode(null)} />;
  }

  function onScanned({ data }: BarcodeScanningResult) {
    const parsed = parseAttendanceLink(data);
    if (parsed) {
      setCode(parsed); // the camera unmounts: no second scan of the same code
    } else if (data !== wrongCode) {
      // Say so once per foreign code, not on every frame it stays in view.
      haptics.error();
      setWrongCode(data);
    }
  }

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
        <View className="flex-1 px-5">
          <Pressable
            onPress={close}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              marginTop: 8,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.45)',
            })}>
            <Text variant="headline" className="text-white">
              ✕
            </Text>
          </Pressable>

          {!permission ? null : permission.granted ? (
            <View className="flex-1 items-center justify-center gap-6">
              <Corners />
              <View className="items-center gap-2 rounded-2xl px-4 py-3" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
                <Text variant="headline" className="text-white" style={{ textAlign: 'center' }}>
                  Scan the code on your teacher’s screen
                </Text>
                {wrongCode && (
                  <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)}>
                    <Text variant="subhead" style={{ color: colors.warning, textAlign: 'center' }} accessibilityLiveRegion="polite">
                      That isn’t a MakonBook attendance code.
                    </Text>
                  </Animated.View>
                )}
              </View>
            </View>
          ) : (
            <View className="flex-1 justify-center gap-4">
              <Text variant="title2" className="text-white">
                Allow the camera
              </Text>
              <Text variant="body" style={{ color: colors.secondaryText }}>
                MakonBook uses the camera only to read your teacher’s attendance code. Nothing is recorded.
              </Text>
              {permission.canAskAgain ? (
                <Button label="Allow camera" onPress={requestPermission} />
              ) : (
                <Button label="Open Settings" onPress={() => Linking.openSettings()} />
              )}
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

// Corner marks showing where to hold the code.
function Corners() {
  const arm = 34;
  const line = { position: 'absolute' as const, backgroundColor: colors.text, borderRadius: 2 };
  return (
    <View style={{ width: FRAME, height: FRAME }} accessible={false}>
      {[
        { top: 0, left: 0 },
        { top: 0, right: 0 },
        { bottom: 0, left: 0 },
        { bottom: 0, right: 0 },
      ].map((pos, i) => (
        <View key={i} style={{ position: 'absolute', width: arm, height: arm, ...pos }}>
          <View style={{ ...line, height: 4, width: arm, [pos.top === 0 ? 'top' : 'bottom']: 0 }} />
          <View style={{ ...line, width: 4, height: arm, [pos.left === 0 ? 'left' : 'right']: 0 }} />
        </View>
      ))}
    </View>
  );
}
