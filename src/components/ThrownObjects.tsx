import { View } from 'react-native';
import Animated, { FadeIn, useReducedMotion, withDelay, withSpring, withTiming, type EntryExitAnimationFunction } from 'react-native-reanimated';
import Svg, { G } from 'react-native-svg';

import { SHAPES } from '@/components/SubjectSpill';
import { spring } from '@/design/motion';

/** One object at rest: a SubjectSpill shape, its colour, scale and place, from the layer's right edge (or left, to come in from the left). */
export type Thrown = { shape: string; color: string; scale: number; right?: number; left?: number; top?: number; bottom?: number; opacity: number };

// A thrown object settles like anything that just appears: no bounce, a
// navigation carries no momentum. Slower than a tap's response, so it reads as a throw.
const THROW = spring(0.8);
const BOX = 44; // shapes are drawn about the origin, within ±22

function enter(travel: number, turn: number, delay: number, opacity: number): EntryExitAnimationFunction {
  return () => {
    'worklet';
    return {
      initialValues: { opacity: 0, transform: [{ translateX: travel }, { rotate: `${turn}deg` }] },
      animations: {
        opacity: withDelay(delay, withTiming(opacity, { duration: 220 })),
        transform: [{ translateX: withDelay(delay, withSpring(0, THROW)) }, { rotate: withDelay(delay, withSpring('0deg', THROW)) }],
      },
    };
  };
}

// Objects thrown in from the right (or, placed by `left`, from the left) each
// time `play` changes, landing where they rest. `travel` is how far outside
// its resting place each one starts
// (past the screen edge, or just past its layer's edge when the layer clips);
// nearer ones land first. Under Reduce Motion they only fade in.
export function ThrownObjects({ items, play, travel, delay = 0 }: { items: Thrown[]; play: number; travel: (item: Thrown) => number; delay?: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}>
      {items.map((o, i) => {
        const size = BOX * o.scale;
        return (
          <Animated.View
            key={`${play}-${i}`}
            entering={reduceMotion ? FadeIn.duration(300) : enter((travel(o) + size) * (o.left != null ? -1 : 1), (i % 2 ? 60 : -50) * (o.left != null ? -1 : 1), delay + i * 45, o.opacity)}
            style={{ position: 'absolute', right: o.right, left: o.left, top: o.top, bottom: o.bottom, width: size, height: size, opacity: o.opacity }}>
            <Svg width={size} height={size}>
              <G transform={`translate(${size / 2} ${size / 2}) scale(${o.scale})`}>{SHAPES[o.shape]!(o.color)}</G>
            </Svg>
          </Animated.View>
        );
      })}
    </View>
  );
}
