import type { LucideIcon } from 'lucide-react-native';

import { useColors } from '@/design/colors';

type IconProps = {
  /** A Lucide icon, e.g. `import { Clock } from 'lucide-react-native'`. */
  as: LucideIcon;
  size?: number;
  /** Defaults to the ink colour of the current scheme. */
  color?: string;
  /** Fill for icons that have a filled state (a marked bookmark). */
  fill?: string;
  strokeWidth?: number;
};

// The app's one icon family: Lucide, at one stroke weight. Icons are
// decoration next to a label or inside a control that carries its own
// accessibility label, so they are hidden from screen readers.
export function Icon({ as: Glyph, size = 20, color, fill = 'none', strokeWidth = 1.75 }: IconProps) {
  const colors = useColors();
  return (
    <Glyph
      size={size}
      color={color ?? colors.ink}
      fill={fill}
      strokeWidth={strokeWidth}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
