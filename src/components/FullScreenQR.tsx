import { useEffect } from 'react';
import { Modal, Platform, Pressable, useWindowDimensions } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { RotatingQR } from '@/components/RotatingQR';

type FullScreenQRProps = {
  visible: boolean;
  onClose: () => void;
  sessionId: string;
  secret: string;
  clockOffsetMs: number;
};

// The attendance code filling the screen on white, at full brightness, for a
// room where the phone is held up to the class. Tap anywhere to close.
//
// Brightness is raised for this app's window only (no permission needed) and
// handed back when the code closes. expo-brightness is loaded lazily, so a
// build without it still shows the code, just at the current brightness.
export function FullScreenQR({ visible, onClose, sessionId, secret, clockOffsetMs }: FullScreenQRProps) {
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const size = Math.min(width - 40, height - 160, 460);

  useEffect(() => {
    if (!visible) return;
    let previous: number | null = null;
    let restore: (() => void) | null = null;
    // A build without the native module can fail before a promise exists.
    let loading: Promise<typeof import('expo-brightness')>;
    try {
      loading = import('expo-brightness');
    } catch {
      return;
    }
    loading
      .then(async (Brightness) => {
        previous = await Brightness.getBrightnessAsync();
        await Brightness.setBrightnessAsync(1);
        restore = () => {
          // Android: give the window back to the system setting; iOS keeps a
          // changed value until the phone locks, so put the old one back.
          (Platform.OS === 'android' ? Brightness.restoreSystemBrightnessAsync() : Brightness.setBrightnessAsync(previous ?? 0.5)).catch(() => {});
        };
      })
      .catch(() => {});
    return () => restore?.();
  }, [visible]);

  return (
    <Modal visible={visible} animationType={reduceMotion ? 'none' : 'fade'} onRequestClose={onClose} statusBarTranslucent>
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close the full-screen code"
        style={{ flex: 1, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
        <RotatingQR sessionId={sessionId} secret={secret} clockOffsetMs={clockOffsetMs} size={size} bare />
      </Pressable>
    </Modal>
  );
}
