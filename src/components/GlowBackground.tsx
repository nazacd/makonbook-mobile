// @ts-nocheck
/**
 * GlowBackground.tsx
 *
 * Animated "breathing" glow background for the homepage.
 * Soft-edged radial-gradient blobs (react-native-svg) animated via
 * react-native-reanimated — no BlurView, no native blur dependency.
 *
 * Usage:
 *   import GlowBackground from './GlowBackground';
 *
 *   export default function HomeScreen() {
 *     return (
 *       <View style={{ flex: 1 }}>
 *         <GlowBackground />
 *         <YourContent />
 *       </View>
 *     );
 *   }
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withDelay,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ---- Tune these to match your design tokens ----
// A cohesive violet family built around the app's --color-accent (#8b5cf6),
// so overlapping blobs blend into each other instead of clashing.
const GLOW_COLORS = {
  primary: '#8B5CF6', // violet (accent)
  secondary: '#6366F1', // indigo
  tertiary: '#C026D3', // fuchsia
};

const BREATH_DURATION = 4500; // ms per half-cycle (in -> out) — slow enough to clearly read as breathing

type BlobConfig = {
  color: string;
  size: number;
  cx: number;
  cy: number;
  minOpacity: number;
  maxOpacity: number;
  minScale: number;
  maxScale: number;
  delay: number;
};

function GlowBlob({ config }: { config: BlobConfig }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      config.delay,
      withRepeat(
        withTiming(1, {
          duration: BREATH_DURATION,
          easing: Easing.inOut(Easing.sin),
        }),
        -1, // infinite
        true, // reverse each cycle (breathe in / out)
      ),
    );
  }, []);

  const animatedProps = useAnimatedProps(() => {
    const opacity =
      config.minOpacity + (config.maxOpacity - config.minOpacity) * progress.value;
    const scale =
      config.minScale + (config.maxScale - config.minScale) * progress.value;

    // Radius goes up to ~size (not size / 2) — the SVG canvas is size * 2,
    // so this fills more of the same footprint with the soft gradient
    // above instead of a small disc with abrupt edges.
    return {
      opacity,
      r: config.size * 0.9 * scale,
    };
  });

  const gradientId = `glow-${config.color.replace('#', '')}`;

  // Canvas half-extent needs headroom above the circle's max radius
  // (size * 0.9 * maxScale) — otherwise <Svg> hard-clips the circle at its
  // rectangular bounds, which shows up as a straight cutoff line instead of
  // a soft fade.
  const canvasHalf = config.size * 0.9 * config.maxScale + 1;

  return (
    <Svg
      style={[
        styles.blob,
        {
          width: canvasHalf * 2,
          height: canvasHalf * 2,
          left: config.cx - canvasHalf,
          top: config.cy - canvasHalf,
        },
      ]}
    >
      <Defs>
        {/* Many gradual stops (instead of a hard core -> transparent edge)
            approximate a Gaussian blur falloff, so the glow reads as soft
            and diffuse across its whole radius rather than a disc with a
            fuzzy rim — same footprint, just blurrier. */}
        <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={config.color} stopOpacity={0.32} />
          <Stop offset="15%" stopColor={config.color} stopOpacity={0.28} />
          <Stop offset="35%" stopColor={config.color} stopOpacity={0.2} />
          <Stop offset="55%" stopColor={config.color} stopOpacity={0.12} />
          <Stop offset="75%" stopColor={config.color} stopOpacity={0.05} />
          <Stop offset="100%" stopColor={config.color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <AnimatedCircle
        cx={canvasHalf}
        cy={canvasHalf}
        fill={`url(#${gradientId})`}
        animatedProps={animatedProps}
      />
    </Svg>
  );
}

export default function GlowBackground() {
  const { width, height } = useWindowDimensions();

  // Sized and placed to overlap generously — the shared violet family plus
  // the extra gradient stop above lets the overlaps blend into one glow
  // rather than showing distinct discs.
  // Wide opacity/scale swings + a per-blob delay stagger — subtle amplitude
  // on a soft gradient reads as static, so the breathing needs to be
  // exaggerated and out-of-phase to actually be visible.
  const blobs: BlobConfig[] = [
    {
      color: GLOW_COLORS.primary,
      size: width * 0.75,
      cx: width * 0.18,
      cy: height * 0.08,
      minOpacity: 0.4,
      maxOpacity: 0.65,
      minScale: 0.75,
      maxScale: 1.3,
      delay: 0,
    },
    {
      color: GLOW_COLORS.secondary,
      size: width * 0.75,
      cx: width * 0.9,
      cy: height * 0.28,
      minOpacity: 0.32,
      maxOpacity: 0.55,
      minScale: 0.8,
      maxScale: 1.35,
      delay: 900,
    },
    {
      color: GLOW_COLORS.tertiary,
      size: width * 0.7,
      cx: width * 0.22,
      cy: height * 0.62,
      minOpacity: 0.28,
      maxOpacity: 0.5,
      minScale: 0.75,
      maxScale: 1.28,
      delay: 1800,
    },
    {
      color: GLOW_COLORS.primary,
      size: width * 0.65,
      cx: width * 0.92,
      cy: height * 0.92,
      minOpacity: 0.25,
      maxOpacity: 0.45,
      minScale: 0.78,
      maxScale: 1.3,
      delay: 2700,
    },
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, styles.base]} />

      {blobs.map((blob, i) => (
        <GlowBlob key={i} config={blob} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#01000f', // --color-brand
  },
  blob: {
    position: 'absolute',
  },
});
