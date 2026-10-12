import { ReduceMotion, type WithSpringConfig } from 'react-native-reanimated';

// Springs are described the way Apple describes them: a damping ratio
// (1 = critically damped, no overshoot; below 1 = bounce) and a response in
// seconds (how quickly the value gets to the target; not a fixed duration).
// They convert exactly to a mass-1 physical spring:
//   stiffness = (2π / response)²   damping = 4π · ratio / response
export function spring(response: number, dampingRatio = 1): WithSpringConfig {
  return {
    mass: 1,
    stiffness: (2 * Math.PI / response) ** 2,
    damping: (4 * Math.PI * dampingRatio) / response,
    // Respect the system setting: with reduced motion on, springs jump to the
    // end and components fall back to opacity (see usePressFeedback).
    reduceMotion: ReduceMotion.System,
  };
}

export const springs = {
  // Everything that just appears or responds to a tap: no overshoot.
  default: spring(0.35),
  // Press-in feedback has to land within a frame or two of the touch.
  press: spring(0.18),
  // Only after a gesture that carried momentum (a flick, a throw).
  momentum: spring(0.35, 0.8),
} as const;

// How far a flick would carry if left to decelerate like a scroll view
// (Apple's projection; 0.998 matches normal scrolling).
export function project(velocity: number, decelerationRate = 0.998): number {
  'worklet';
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

// Progressive resistance past a boundary instead of a hard stop.
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  'worklet';
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}
