import { useEffect, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { random } from '@/components/SubjectSpill';
import { useColors, type Palette } from '@/design/colors';

// The palette's colours: terracotta, mustard, sage, sky, violet, and the ink.
const COLORS: (keyof Palette)[] = ['english', 'fillWatch', 'good', 'math2', 'accent', 'ink'];

type Piece = { left: boolean; w: number; h: number; color: keyof Palette; dx: number; up: number; down: number; rot: number; ms: number; delay: number };

// A burst of confetti from both bottom corners: each piece arcs up and in,
// then falls away and fades. Once, on mount; nothing under Reduce Motion.
export function Confetti({ count = 44, seed = 7 }: { count?: number; seed?: number }) {
  const reduceMotion = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const [pieces] = useState(() => {
    const r = random(seed);
    return Array.from({ length: count }, (_, k): Piece => {
      const w = 5 + Math.round(r() * 5);
      return {
        left: k % 2 === 0,
        w,
        h: r() < 0.4 ? w : 10 + Math.round(r() * 6),
        color: COLORS[k % COLORS.length]!,
        dx: width * (0.2 + r() * 0.5),
        up: height * (0.35 + r() * 0.3),
        down: height * (0.15 + r() * 0.25),
        rot: 240 + r() * 480,
        ms: 1500 + r() * 900,
        delay: Math.round(r() * 260),
      };
    });
  });
  if (reduceMotion) return null;
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden' }}>
      {pieces.map((p, i) => (
        <ConfettiPiece key={i} piece={p} />
      ))}
    </View>
  );
}

function ConfettiPiece({ piece: p }: { piece: Piece }) {
  const colors = useColors();
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(p.delay, withTiming(1, { duration: p.ms, easing: Easing.out(Easing.quad) }));
  }, [t, p.delay, p.ms]);
  const style = useAnimatedStyle(() => {
    const k = t.value;
    const sign = p.left ? 1 : -1;
    return {
      opacity: k === 0 ? 0 : k < 0.7 ? 1 : (1 - k) / 0.3,
      transform: [
        { translateX: sign * p.dx * k },
        // Up in an arc, then down past where it started.
        { translateY: -p.up * 4 * k * (1 - k) + p.down * k * k },
        { rotate: `${sign * p.rot * k}deg` },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        { position: 'absolute', bottom: 60, width: p.w, height: p.h, borderRadius: 2, backgroundColor: colors[p.color] },
        p.left ? { left: -10 } : { right: -10 },
        style,
      ]}
    />
  );
}
