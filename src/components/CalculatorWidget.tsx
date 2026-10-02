import { useState } from 'react';
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

// How long the Desmos script may take before the spinner gets a "slow
// connection" hint. Loading keeps going; this only explains the wait.
const SLOW_LOAD_HINT_MS = 6000;

function buildCalculatorHtml(apiKey: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>
  html, body { margin: 0; padding: 0; height: 100%; background: #01000f; overflow: hidden; }
  #calculator { position: absolute; top: 0; left: 0; right: 0; bottom: 0; }
  .overlay {
    display: none;
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background: #01000f; color: #ffffff;
    align-items: center; justify-content: center;
    flex-direction: column; gap: 16px; padding: 24px; text-align: center;
    font-family: -apple-system, Roboto, sans-serif;
  }
  .overlay.visible { display: flex; }
  .overlay p { color: rgba(255,255,255,0.7); font-size: 15px; line-height: 1.5; margin: 0; }
  .spinner {
    width: 36px; height: 36px; box-sizing: border-box; border-radius: 50%;
    border: 4px solid rgba(139,92,246,0.2); border-top-color: #8b5cf6;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  #slow-hint { display: none; }
  #retry {
    border: 0; border-radius: 12px; padding: 10px 24px;
    background: #8b5cf6; color: #ffffff; font-size: 15px; font-weight: 600;
    font-family: inherit;
  }
</style>
</head>
<body>
  <div id="calculator"></div>
  <div id="loading" class="overlay">
    <div class="spinner"></div>
    <p id="slow-hint">Slow connection. Still loading the calculator…</p>
  </div>
  <div id="fallback" class="overlay">
    <p>${
      apiKey
        ? 'No internet connection.<br/>Connect to Wi-Fi to use the graphing calculator.'
        : 'Calculator is not configured.<br/>Ask staff to set the Desmos API key.'
    }</p>
    ${apiKey ? '<button id="retry" type="button">Try again</button>' : ''}
  </div>
  <script>
    var API_KEY = ${JSON.stringify(apiKey)};
    var calculator = null;
    var slowTimer = null;

    function show(id, visible) {
      document.getElementById(id).className = visible ? 'overlay visible' : 'overlay';
    }

    function onLoaded() {
      clearTimeout(slowTimer);
      if (typeof Desmos === 'undefined') return onFailed();
      show('loading', false);
      calculator = Desmos.GraphingCalculator(document.getElementById('calculator'), {
        keypad: true,
        expressionsCollapsed: false,
        settingsMenu: false,
        zoomButtons: true,
        border: false
      });
    }

    function onFailed() {
      clearTimeout(slowTimer);
      show('loading', false);
      show('fallback', true);
    }

    // Load the script asynchronously instead of with a blocking <script src>
    // so the spinner is on screen while it downloads, and so we hear about
    // success or failure the moment it happens rather than after a fixed wait.
    function loadDesmos() {
      show('fallback', false);
      show('loading', true);
      document.getElementById('slow-hint').style.display = 'none';
      slowTimer = setTimeout(function () {
        document.getElementById('slow-hint').style.display = 'block';
      }, ${SLOW_LOAD_HINT_MS});
      var script = document.createElement('script');
      script.src = 'https://www.desmos.com/api/v1.11/calculator.js?apiKey=' + encodeURIComponent(API_KEY);
      script.onload = onLoaded;
      script.onerror = function () {
        script.remove();
        onFailed();
      };
      document.head.appendChild(script);
    }

    // The widget is resizable, so keep the calculator's layout in sync.
    window.addEventListener('resize', function () {
      if (calculator) calculator.resize();
    });

    if (API_KEY) {
      document.getElementById('retry').addEventListener('click', loadDesmos);
      loadDesmos();
    } else {
      show('fallback', true);
    }
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

  // Mount the WebView on first open, then keep it mounted (hidden) so the
  // calculator's state survives closing and reopening it.
  const [hasOpened, setHasOpened] = useState(visible);
  if (visible && !hasOpened) setHasOpened(true);

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
          // Matches the page background so there's no white flash while the
          // WebView itself starts up, before the page's spinner is painted.
          style={{ flex: 1, backgroundColor: '#01000f' }}
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
