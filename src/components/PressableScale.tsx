import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { springs } from '@/design/motion';

type PressableScaleProps = Omit<PressableProps, 'children' | 'style'> & {
  children: ReactNode;
  /** Classes for the pressable surface itself (background, padding, radius). */
  className?: string;
  /** Layout of the outer, animated wrapper (margins, alignSelf, flex). */
  style?: StyleProp<ViewStyle>;
  /** How far the surface sinks on press. Small for large surfaces. */
  pressedScale?: number;
};

// A pressable surface that answers the instant a finger lands, not when it
// lifts: it sinks slightly on press-in and springs back on release. The
// spring starts from wherever the surface is, so a quick tap-tap, or a press
// cancelled by dragging away, never jumps.
//
// With Reduce Motion on, the surface dims instead of scaling.
//
// The scale lives on an Animated.View wrapper because react-native-css only
// gives className to the core components; the classes go on the Pressable.
export function PressableScale({
  children,
  className,
  style,
  pressedScale = 0.97,
  disabled,
  onPressIn,
  onPressOut,
  ...props
}: PressableScaleProps) {
  const reduceMotion = useReducedMotion();
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() =>
    reduceMotion
      ? { opacity: 1 - pressed.value * 0.35 }
      : { transform: [{ scale: 1 - pressed.value * (1 - pressedScale) }] },
  );

  return (
    <Animated.View style={[style, animatedStyle]}>
      <Pressable
        {...props}
        disabled={disabled}
        className={className}
        onPressIn={(e) => {
          pressed.value = withSpring(1, springs.press);
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          pressed.value = withSpring(0, springs.default);
          onPressOut?.(e);
        }}>
        {children}
      </Pressable>
    </Animated.View>
  );
}
