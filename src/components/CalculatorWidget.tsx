import { useEffect, useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';
import { WebView } from 'react-native-webview';

import { DESMOS_API_KEY } from '@/lib/config';

type CalculatorWidgetProps = {
  visible: boolean;
  onClose: () => void;
};

const DEFAULT_WIDTH = 320;
const DEFAULT_HEIGHT = 420;
const MIN_WIDTH = 260;
const MIN_HEIGHT = 300;
const EDGE_MARGIN = 8;
const DRAG_HANDLE_HEIGHT = 20;

function clamp(value: number, min: number, max: number): number {
  'worklet';
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function buildCalculatorHtml(apiKey: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>
  html, body { margin: 0; padding: 0; height: 100%; background: #01000f; overflow: hidden; }
  #calculator { position: absolute; top: 0; left: 0; right: 0; bottom: 0; }
  #fallback {
    display: none;
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background: #01000f; color: #ffffff;
    align-items: center; justify-content: center;
    flex-direction: column; padding: 24px; text-align: center;
    font-family: -apple-system, Roboto, sans-serif;
  }
  #fallback.visible { display: flex; }
  #fallback p { color: rgba(255,255,255,0.7); font-size: 15px; line-height: 1.5; margin: 0; }
</style>
</head>
<body>
  <div id="calculator"></div>
  <div id="fallback">
    <p>No internet connection.<br/>Connect to Wi-Fi to use the graphing calculator.</p>
  </div>
  <script src="https://www.desmos.com/api/v1.11/calculator.js?apiKey=${apiKey}"></script>
  <script>
    setTimeout(function () {
      if (typeof Desmos === 'undefined') {
        document.getElementById('calculator').style.display = 'none';
        document.getElementById('fallback').className = 'visible';
        return;
      }
      var elt = document.getElementById('calculator');
      Desmos.GraphingCalculator(elt, {
        keypad: true,
        expressionsCollapsed: false,
        settingsMenu: false,
        zoomButtons: true,
        border: false
      });
    }, 4000);
  </script>
</body>
</html>`;
}

function ResizeGripIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Line x1={12} y1={2} x2={2} y2={12} stroke="rgba(255,255,255,0.45)" strokeWidth={2} strokeLinecap="round" />
      <Line x1={12} y1={7} x2={7} y2={12} stroke="rgba(255,255,255,0.45)" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function CloseIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Line x1={2} y1={2} x2={12} y2={12} stroke="#ffffff" strokeWidth={2} strokeLinecap="round" />
      <Line x1={12} y1={2} x2={2} y2={12} stroke="#ffffff" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function CalculatorWidget({ visible, onClose }: CalculatorWidgetProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const initialWidth = Math.min(DEFAULT_WIDTH, screenWidth - EDGE_MARGIN * 2);
  const initialHeight = Math.min(DEFAULT_HEIGHT, screenHeight - EDGE_MARGIN * 2);
  const initialX = (screenWidth - initialWidth) / 2;
  const initialY = (screenHeight - initialHeight) / 2;

  const x = useSharedValue(initialX);
  const y = useSharedValue(initialY);
  const width = useSharedValue(initialWidth);
  const height = useSharedValue(initialHeight);
  const startX = useSharedValue(initialX);
  const startY = useSharedValue(initialY);
  const startWidth = useSharedValue(initialWidth);
  const startHeight = useSharedValue(initialHeight);

  const dragGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = x.value;
      startY.value = y.value;
    })
    .onUpdate((event) => {
      const maxX = screenWidth - width.value - EDGE_MARGIN;
      const maxY = screenHeight - height.value - EDGE_MARGIN;
      x.value = clamp(startX.value + event.translationX, EDGE_MARGIN, maxX);
      y.value = clamp(startY.value + event.translationY, EDGE_MARGIN, maxY);
    });

  const resizeGesture = Gesture.Pan()
    .onStart(() => {
      startWidth.value = width.value;
      startHeight.value = height.value;
    })
    .onUpdate((event) => {
      const maxWidth = screenWidth - x.value - EDGE_MARGIN;
      const maxHeight = screenHeight - y.value - EDGE_MARGIN;
      width.value = clamp(startWidth.value + event.translationX, MIN_WIDTH, maxWidth);
      height.value = clamp(startHeight.value + event.translationY, MIN_HEIGHT, maxHeight);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    left: x.value,
    top: y.value,
    width: width.value,
    height: height.value,
  }));

  const [hasOpened, setHasOpened] = useState(visible);
  useEffect(() => {
    if (visible) setHasOpened(true);
  }, [visible]);

  if (!hasOpened) return null;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          display: visible ? 'flex' : 'none',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          elevation: 12,
        },
        animatedStyle,
      ]}
      className="overflow-hidden rounded-2xl border border-white/10 bg-surface">
      <GestureDetector gesture={dragGesture}>
        <View style={{ height: DRAG_HANDLE_HEIGHT }} className="items-center justify-center">
          <View className="h-1 w-10 rounded-full bg-white/20" />
        </View>
      </GestureDetector>

      <View className="flex-1">
        <WebView
          originWhitelist={['*']}
          source={{ html: buildCalculatorHtml(DESMOS_API_KEY) }}
          style={{ flex: 1 }}
          scrollEnabled={false}
          bounces={false}
          onShouldStartLoadWithRequest={(request) =>
            request.url === 'about:blank' || request.url.startsWith('data:')
          }
        />
      </View>

      <Pressable
        onPress={onClose}
        hitSlop={8}
        style={{ position: 'absolute', top: 4, right: 4 }}
        className="h-7 w-7 items-center justify-center rounded-full bg-brand/70">
        <CloseIcon />
      </Pressable>

      <GestureDetector gesture={resizeGesture}>
        <View
          style={{ position: 'absolute', right: 0, bottom: 0, width: 28, height: 28 }}
          className="items-end justify-end p-1.5">
          <ResizeGripIcon />
        </View>
      </GestureDetector>
    </Animated.View>
  );
}
