import { View } from 'react-native';

import { ThrownObjects, type Thrown } from '@/components/ThrownObjects';
import type { PlacementSubject } from '@/lib/types';

// The Level Check's subject objects, spilling in from the right of a coloured
// block (a subject card, the start page's top) once the screen has slid in. Drawn in
// the block's text colour, faint, clear of its text on the left and bottom.
// [shape, scale, right, top, opacity]
type Spot = [string, number, number, number, number];

const CARD: Record<PlacementSubject, Spot[]> = {
  math: [
    ['pi', 1.25, 18, 16, 0.34],
    ['root', 0.95, 82, 8, 0.22],
    ['xSquared', 0.8, 132, 30, 0.16],
    ['axes', 0.9, 66, 62, 0.2],
    ['plus', 0.7, 14, 74, 0.18],
  ],
  english: [
    ['quote', 1.3, 18, 16, 0.34],
    ['book', 1, 84, 10, 0.22],
    ['amp', 0.8, 136, 30, 0.16],
    ['para', 0.85, 66, 62, 0.2],
    ['semi', 0.75, 16, 76, 0.18],
  ],
};

const HERO: Record<PlacementSubject, Spot[]> = {
  math: [
    ['pi', 1.6, 22, 14, 0.34],
    ['root', 1.15, 104, 4, 0.22],
    ['xSquared', 0.95, 170, 40, 0.15],
    ['axes', 1.1, 70, 84, 0.22],
    ['plus', 0.8, 18, 118, 0.18],
    ['theta', 0.8, 142, 112, 0.14],
  ],
  english: [
    ['quote', 1.6, 22, 14, 0.34],
    ['book', 1.2, 106, 6, 0.22],
    ['amp', 0.95, 172, 40, 0.15],
    ['para', 1.05, 70, 86, 0.22],
    ['semi', 0.85, 18, 120, 0.18],
    ['schwa', 0.8, 144, 112, 0.14],
  ],
};

/** `top` keeps them below the status bar when the block runs under it. */
export function PlacementObjects({ subject, color, hero = false, top = 0, play = 0, delay = 0 }: { subject: PlacementSubject; color: string; hero?: boolean; top?: number; play?: number; delay?: number }) {
  const items: Thrown[] = (hero ? HERO : CARD)[subject].map(([shape, scale, right, top, opacity]) => ({ shape, scale, right, top, opacity, color }));
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top, right: 0, bottom: 0, width: hero ? 240 : 200 }}>
      <ThrownObjects items={items} play={play} travel={(o) => (o.right ?? 0) + 30} delay={delay} />
    </View>
  );
}
