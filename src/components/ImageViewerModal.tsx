import { Modal, Pressable, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';

type ImageViewerModalProps = {
  visible: boolean;
  source: number | { uri: string } | null;
  onClose: () => void;
};

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;

function clamp(value: number, min: number, max: number): number {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

function CloseIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 14 14" fill="none">
      <Line x1={2} y1={2} x2={12} y2={12} stroke="#ffffff" strokeWidth={2} strokeLinecap="round" />
      <Line x1={12} y1={2} x2={2} y2={12} stroke="#ffffff" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function ImageViewerModal({ visible, source, onClose }: ImageViewerModalProps) {
  const { width, height } = useWindowDimensions();

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = clamp(savedScale.value * event.scale, MIN_SCALE, MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1) {
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (savedScale.value <= 1) return;
      const maxTranslateX = ((savedScale.value - 1) * width) / 2;
      const maxTranslateY = ((savedScale.value - 1) * height) / 2;
      translateX.value = clamp(savedTranslateX.value + event.translationX, -maxTranslateX, maxTranslateX);
      translateY.value = clamp(savedTranslateY.value + event.translationY, -maxTranslateY, maxTranslateY);
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withTiming(DOUBLE_TAP_SCALE);
        savedScale.value = DOUBLE_TAP_SCALE;
      }
    });

  const composedGesture = Gesture.Simultaneous(doubleTapGesture, Gesture.Simultaneous(pinchGesture, panGesture));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
  }));

  if (!visible || !source) return null;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 bg-black">
          <GestureDetector gesture={composedGesture}>
            <Animated.View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Animated.Image
                source={source}
                style={[{ width, height: height * 0.85 }, animatedStyle]}
                resizeMode="contain"
              />
            </Animated.View>
          </GestureDetector>

          <SafeAreaView style={{ position: 'absolute', top: 0, right: 0 }}>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              className="m-3 h-9 w-9 items-center justify-center rounded-full bg-surface/80">
              <CloseIcon />
            </Pressable>
          </SafeAreaView>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
