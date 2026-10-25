import { useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { FadeInRight, useReducedMotion } from 'react-native-reanimated';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { useColors } from '@/design/colors';
import { fonts } from '@/design/typography';
import type { Level, Subject } from '@/lib/groups';

// A subject's objects spilling in from the screen's right edge behind a block
// of text: densest at the edge, thinning and fading inward. Math in navy
// tones, English in terracotta tones; only size and opacity vary. The level
// shows in the pile: Foundation spills a few simple objects, Pre-SAT more and
// a step harder, Advanced the richest pile. Objects are placed around the
// measured text and controls, never under them, and fit inside the block's
// height, so the only cut is the screen edge. Seeded from the group's ID: the
// same layout on every open, different for every class.

type Shape = (color: string) => ReactNode;

const glyph = (t: string, size = 26): Shape =>
  function glyphShape(c) {
    return (
      <SvgText x={0} y={size * 0.35} textAnchor="middle" fontFamily={fonts.displayBold} fontSize={size} fill={c}>
        {t}
      </SvgText>
    );
  };
// English objects never use the title face: outlined letters in a plain serif.
const outline = (t: string, size = 30): Shape =>
  function outlineShape(c) {
    return (
      <SvgText x={0} y={size * 0.35} textAnchor="middle" fontFamily="serif" fontSize={size} fill="none" stroke={c} strokeWidth={1.3}>
        {t}
      </SvgText>
    );
  };
const stroke = (d: string, w = 2.4): Shape =>
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
  ...Object.fromEntries('0123456789'.split('').map((d) => [d, glyph(d, 28)])),
  plus: glyph('+', 30),
  minus: glyph('−', 30),
  times: glyph('×', 28),
  divide: glyph('÷', 28),
  pi: glyph('π'),
  root: glyph('√'),
  sum: glyph('∑'),
  integral: glyph('∫', 30),
  triangle: fill('M-11 9 L11 9 L-11 -11 Z M-7 5 L1 5 L-7 -3 Z'),
  compass: (c) => (
    <G>
      {stroke('M0 -9 L-7 11 M0 -9 L7 11 M-4 3 L4 3', 2.3)(c)}
      <Circle cx={0} cy={-10} r={2.6} fill={c} />
    </G>
  ),
  protractor: fill('M-12 6 A12 12 0 0 1 12 6 Z M-6 6 A6 6 0 0 1 6 6 Z'),
  parabola: (c) => (
    <G>
      {stroke('M-12 -11 Q0 23 12 -11', 2.6)(c)}
      {stroke('M-13 8 L13 8', 1.2)(c)}
    </G>
  ),
  graph: (c) => (
    <G>
      <Rect x={-11} y={-11} width={22} height={22} rx={1.5} fill="none" stroke={c} strokeWidth={1.8} />
      {stroke('M-11 -3.7 H11 M-11 3.7 H11 M-3.7 -11 V11 M3.7 -11 V11', 1)(c)}
    </G>
  ),
  oA: outline('A'),
  og: outline('g'),
  oR: outline('R'),
  oQ: outline('?'),
  oBang: outline('!'),
  oAmp: outline('&'),
  oSemi: outline(';'),
  oSect: outline('§'),
  oPara: outline('¶'),
  oGuill: outline('«'),
  quote: fill(QUOTE),
  nib: fill('M0 -12 L8 1 L3 12 L-3 12 L-8 1 Z M0 -1 m-2 0 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0'),
  bookmark: fill('M-7 -12 H7 V12 L0 6 L-7 12 Z'),
  script: stroke('M-13 5 C-9 -11 -5 13 -1 1 S7 -9 9 3 S12 6 14 0', 2.2),
};

type Pool = [shape: string, weight: number][];

// Foundation Math is mostly digits, with fewer + and ×.
const SETS: Record<Subject, Record<Level, Pool>> = {
  Math: {
    foundation: [...'0123456789'.split('').map((d): [string, number] => [d, 1]), ['minus', 1], ['divide', 1], ['plus', 0.4], ['times', 0.4]],
    presat: [['root', 1.4], ['pi', 1.4], ['triangle', 1.2], ['graph', 1.2]],
    advanced: [['sum', 1.6], ['integral', 1.6], ['parabola', 1.4], ['compass', 1.2], ['protractor', 1.2]],
  },
  English: {
    foundation: [['oA', 1], ['og', 1], ['oQ', 1.5], ['oBang', 1.5], ['quote', 1.5]],
    presat: [['oAmp', 1.3], ['oSemi', 1.2], ['oGuill', 1.2], ['bookmark', 1.2], ['oR', 0.8]],
    advanced: [['nib', 1.6], ['script', 1.4], ['oPara', 1.2], ['oSect', 1.2]],
  },
};
const LEVELS: Record<Level, { count: number; pools: Level[] }> = {
  foundation: { count: 10, pools: ['foundation'] },
  presat: { count: 15, pools: ['foundation', 'presat'] },
  advanced: { count: 22, pools: ['foundation', 'presat', 'advanced'] },
};

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
  const lv = LEVELS[level];
  const pool = lv.pools.flatMap((p) => SETS[subject][p]);
  const placed: (Placed & { rad: number })[] = [];
  const target = Math.round(lv.count * countScale);
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
