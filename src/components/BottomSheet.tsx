import { useEffect, type ReactNode } from 'react';
import { Modal, Pressable, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { springs } from '@/design/motion';

// A sheet that rises from the bottom over a dimming screen, and goes back
// down before it's gone. Mount it to open it; it calls `onClosed` once it
// has finished leaving (tap outside, Android back, or the `close` it hands
// its content). Springs, so it can be interrupted; a fade under Reduce Motion.
export function BottomSheet({ onClosed, children }: { onClosed: () => void; children: (close: () => void) => ReactNode }) {
  const { height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const shown = useSharedValue(0);

  useEffect(() => {
    shown.set(withSpring(1, springs.default));
  }, [shown]);

  const close = () => {
    shown.set(
      withSpring(0, springs.default, (finished) => {
        if (finished) scheduleOnRN(onClosed);
      }),
    );
  };

  const backdrop = useAnimatedStyle(() => ({ opacity: shown.value }));
  const sheet = useAnimatedStyle(() =>
    reduceMotion ? { opacity: shown.value } : { transform: [{ translateY: (1 - shown.value) * height }] },
  );

  return (
    <Modal visible transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      <View className="flex-1 justify-end">
        <Animated.View style={[{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.45)' }, backdrop]}>
          <Pressable className="flex-1" onPress={close} accessibilityLabel="Close" />
        </Animated.View>
        <Animated.View style={[{ maxHeight: '88%' }, sheet]}>{children(close)}</Animated.View>
      </View>
    </Modal>
  );
}
