import { useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { FadeInRight, useReducedMotion } from 'react-native-reanimated';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';

import { useColors } from '@/design/colors';
import { fonts } from '@/design/typography';
import type { Level, Subject } from '@/lib/groups';

// A subject's objects spilling in from the screen's right edge behind a block
// of text: densest at the edge, thinning and fading inward. Math in navy
// tones, English in terracotta tones; only size and opacity vary. The level
// shows in what spills, never in how much: every level throws the same number
// of objects, Foundation the simple ones, Pre-SAT a step on, Advanced the
// specialist ones. Objects are placed around the measured text and controls,
// never under them, and fit inside the block's height, so the only cut is the
// screen edge. Seeded from the group's ID: the same layout on every open,
// different for every class.

type Shape = (color: string) => ReactNode;

// Arithmetic in the title face.
const glyph = (t: string, size = 26): Shape =>
  function glyphShape(c) {
    return (
      <SvgText x={0} y={size * 0.35} textAnchor="middle" fontFamily={fonts.displayBold} fontSize={size} fill={c}>
        {t}
      </SvgText>
    );
  };
// Variables and Greek letters set like typeset maths: serif italic.
const mathItalic = (t: string, size = 30): Shape =>
  function mathShape(c) {
    return (
      <SvgText x={0} y={size * 0.33} textAnchor="middle" fontFamily="serif" fontStyle="italic" fontSize={size} fill={c}>
        {t}
      </SvgText>
    );
  };
// English objects never use the title face: outlined marks in a plain serif.
const outline = (t: string, size = 32): Shape =>
  function outlineShape(c) {
    return (
      <SvgText x={0} y={size * 0.35} textAnchor="middle" fontFamily="serif" fontSize={size} fill="none" stroke={c} strokeWidth={1.3}>
        {t}
      </SvgText>
    );
  };
const stroke = (d: string, w = 2.2): Shape =>
  function strokeShape(c) {
    return <Path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />;
  };
const fill = (d: string): Shape =>
  function fillShape(c) {
    return <Path d={d} fill={c} fillRule="evenodd" />;
  };

const QUOTE =
  'M-10 -3 a4.5 4.5 0 1 1 9 0 c0 6 -3 10 -8 12 l-1 -2 c3 -2 4 -4 4 -6 a4.5 4.5 0 0 1 -4 -4 z M2 -3 a4.5 4.5 0 1 1 9 0 c0 6 -3 10 -8 12 l-1 -2 c3 -2 4 -4 4 -6 a4.5 4.5 0 0 1 -4 -4 z';

const SHAPES: Record<string, Shape> = {
  // Math · Foundation: digits and the four operations.
  ...Object.fromEntries('0123456789'.split('').map((d) => [d, glyph(d, 26)])),
  plus: glyph('+', 32),
  minus: glyph('−', 32),
  times: glyph('×', 30),
  divide: glyph('÷', 30),
  equals: glyph('=', 30),
  // Math · Pre-SAT: algebra and functions.
  x: mathItalic('x', 34),
  y: mathItalic('y', 34),
  fx: mathItalic('f(x)', 22),
  xSquared: mathItalic('x²', 28),
  root: glyph('√', 30),
  percent: glyph('%', 26),
  geq: glyph('≥', 28),
  axes: stroke('M-10 11 V-12 M-12 9 H12 M-8 7 L10 -9', 1.9),
  // Math · Advanced: Greek, trigonometry, calculus.
  pi: mathItalic('π', 32),
  alpha: mathItalic('α', 32),
  beta: mathItalic('β', 32),
  theta: mathItalic('θ', 32),
  sum: glyph('∑', 28),
  integral: glyph('∫', 32),
  infinity: glyph('∞', 30),
  unitCircle: (c) => (
    <G>
      <Circle cx={0} cy={0} r={10} fill="none" stroke={c} strokeWidth={1.8} />
      {stroke('M0 0 L7 -7 M-13 0 H13', 1.6)(c)}
    </G>
  ),
  parabola: (c) => (
    <G>
      {stroke('M-12 -11 Q0 23 12 -11', 2.4)(c)}
      {stroke('M-13 8 L13 8', 1.2)(c)}
    </G>
  ),

  // English · Foundation: punctuation.
  comma: outline(',', 44),
  bang: outline('!'),
  semi: outline(';'),
  amp: outline('&'),
  question: outline('?'),
  apostrophe: outline('’', 44),
  quote: fill(QUOTE),
  // English · Pre-SAT: marks of a page, and reading.
  para: outline('¶'),
  guillemet: outline('«'),
  parens: outline('( )', 26),
  schwa: outline('ə'),
  bookmark: fill('M-7 -12 H7 V12 L0 6 L-7 12 Z'),
  bubble: stroke('M-11 -9 H11 V5 H-2 L-8 11 V5 H-11 Z', 1.9),
  book: stroke('M0 -6 C-4 -9 -8 -9 -12 -8 V9 C-8 8 -4 8 0 11 C4 8 8 8 12 9 V-8 C8 -9 4 -9 0 -6 Z M0 -6 V11', 1.8),
  // English · Advanced: the scholar's marks and the writer's tools.
  section: outline('§'),
  dagger: outline('†'),
  ae: outline('æ'),
  lozenge: stroke('M0 -12 L8 0 L0 12 L-8 0 Z', 1.9),
  nib: fill('M0 -12 L8 1 L3 12 L-3 12 L-8 1 Z M0 -1 m-2 0 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0'),
  quill: stroke('M10 -12 C2 -10 -4 -3 -8 8 M10 -12 C9 -4 4 2 -4 4 M-8 8 L-11 12', 1.9),
  script: stroke('M-13 5 C-9 -11 -5 13 -1 1 S7 -9 9 3 S12 6 14 0', 2.2),
};

type Pool = [shape: string, weight: number][];

const SETS: Record<Subject, Record<Level, Pool>> = {
  Math: {
    // Operations outweigh the digits, so it reads as arithmetic, not a number pile.
    foundation: [...'0123456789'.split('').map((d): [string, number] => [d, 0.45]), ['plus', 1.3], ['minus', 1.3], ['times', 1.3], ['divide', 1.3], ['equals', 0.8]],
    presat: [['x', 1.4], ['y', 1.4], ['fx', 1], ['xSquared', 0.9], ['root', 1.2], ['percent', 1.1], ['geq', 0.8], ['axes', 0.9]],
    advanced: [['pi', 1.2], ['alpha', 1.1], ['beta', 1.1], ['theta', 1.2], ['root', 0.8], ['sum', 0.9], ['integral', 1], ['infinity', 0.8], ['unitCircle', 0.8], ['parabola', 0.8]],
  },
  English: {
    foundation: [['comma', 1.2], ['bang', 1.2], ['semi', 1.2], ['amp', 1.2], ['question', 1], ['apostrophe', 0.8], ['quote', 1]],
    presat: [['para', 1.1], ['guillemet', 1], ['parens', 0.8], ['schwa', 1], ['bookmark', 1.1], ['bubble', 1.1], ['book', 1.1]],
    advanced: [['section', 1.2], ['schwa', 1], ['lozenge', 1.1], ['dagger', 0.9], ['ae', 0.8], ['nib', 1.1], ['quill', 1.1], ['script', 0.9]],
  },
};

/** The same number of objects at every level; only what they are changes. */
const COUNT = 12;

function random(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(r: () => number, pool: Pool): string {
  const total = pool.reduce((sum, [, w]) => sum + w, 0);
  let x = r() * total;
  for (const [shape, w] of pool) {
    x -= w;
    if (x <= 0) return shape;
  }
  return pool[0][0];
}

type Rect4 = { x0: number; y0: number; x1: number; y1: number; edge?: boolean };
type Placed = { x: number; y: number; s: number; t: number; rot: number; shape: string; tone: 0 | 1 };

function place(width: number, height: number, keepOut: Rect4[], subject: Subject, level: Level, seed: number, scale: number, countScale: number): Placed[] {
  const r = random(seed);
  const pool = SETS[subject][level];
  const placed: (Placed & { rad: number })[] = [];
  const target = Math.round(COUNT * countScale);
  for (let tries = 0; placed.length < target && tries < 3000; tries++) {
    const t = Math.pow(r(), 1.7);
    const x = width + 10 - t * width * 0.62;
    const y = r() * height;
    const s = (1.45 - 0.6 * t) * (0.8 + r() * 0.4) * scale;
    const rad = 12 * s;
    if (y - rad * 1.2 < 0 || y + rad * 1.2 > height) continue; // never cut between blocks
    if (keepOut.some((k) => x + rad > k.x0 && x - rad < k.x1 && y + rad > k.y0 && y - rad < k.y1)) continue;
    if (placed.some((p) => Math.hypot(p.x - x, p.y - y) < 0.85 * (p.rad + rad))) continue;
    placed.push({ x, y, s, rad, t, rot: Math.round(r() * 70 - 35), shape: pick(r, pool), tone: r() < 0.6 ? 0 : 1 });
  }
  return placed;
}

/**
 * Registers the views objects must keep clear of (text, controls). Spread
 * `keepOut(name)` onto each one; pass `layer` to <SubjectSpill>.
 */
export function useSpillLayout() {
  const layerRef = useRef<View>(null);
  const targets = useRef(new Map<string, View | null>());
  const [measured, setMeasured] = useState<{ width: number; height: number; rects: Rect4[] } | null>(null);

  const measure = () => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.measureInWindow((lx, ly, width, height) => {
      const views = [...targets.current.entries()].filter((e): e is [string, View] => !!e[1]);
      if (views.length === 0 || width === 0) return;
      const rects: Rect4[] = [];
      let pending = views.length;
      for (const [name, v] of views) {
        v.measureInWindow((x, y, w, h) => {
          // A control registered with toEdge keeps its whole column clear, out
          // to the screen edge and below, so nothing sits beside or under it.
          const edge = name.endsWith(':edge');
          const pad = edge ? 12 : 8;
          rects.push({
            x0: x - lx - pad,
            y0: y - ly - pad,
            x1: edge ? width + 40 : x - lx + w + pad,
            y1: y - ly + h + (edge ? 40 : pad),
          });
          if (--pending === 0) setMeasured({ width, height, rects });
        });
      }
    });
  };

  const keepOut = (name: string, opts: { toEdge?: boolean } = {}) => ({
    ref: (el: View | null) => {
      targets.current.set(name + (opts.toEdge ? ':edge' : ''), el);
    },
    onLayout: measure,
  });

  return { layerRef, measured, measure, keepOut };
}

type SubjectSpillProps = {
  layout: ReturnType<typeof useSpillLayout>;
  subject: Subject;
  level: Level;
  seed: number;
  /** Larger, fainter, sparser objects (the echo behind the next class). */
  echo?: boolean;
  /** How far the layer reaches past the block, top and bottom, into the space around it. */
  bleed?: number;
  /** The screen gutter: the layer reaches through it to the screen's right edge. */
  gutter?: number;
};

export function SubjectSpill({ layout, subject, level, seed, echo = false, bleed = 26, gutter = 20 }: SubjectSpillProps) {
  const colors = useColors();
  const reduceMotion = useReducedMotion();
  const { layerRef, measured, measure } = layout;
  const tones = subject === 'Math' ? [colors.math, colors.math2] : [colors.english, colors.english2];
  const [start, end] = echo ? [0.12, 0.03] : [0.5, 0.06];

  const objects = measured
    ? place(measured.width, measured.height, measured.rects, subject, level, seed, echo ? 1.6 : 1, echo ? 0.6 : 1)
    : [];

  return (
    <View
      ref={layerRef}
      onLayout={measure}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', top: echo ? 0 : -bleed, bottom: -bleed, left: 0, right: -gutter }}>
      {measured && (
        <Animated.View entering={reduceMotion ? undefined : FadeInRight.duration(400)} style={{ flex: 1 }}>
          <Svg width={measured.width} height={measured.height}>
            {objects.map((o, i) => (
              <G
                key={i}
                opacity={start - (start - end) * o.t}
                transform={`translate(${o.x.toFixed(1)} ${o.y.toFixed(1)}) rotate(${o.rot}) scale(${o.s.toFixed(2)})`}>
                {SHAPES[o.shape](tones[o.tone])}
              </G>
            ))}
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}
