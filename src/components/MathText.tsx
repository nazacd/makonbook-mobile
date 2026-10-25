import { MathJaxSvg } from 'react-native-mathjax-html-to-svg';

import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';

const LATEX_DELIMITER_PATTERN = /\\\(|\\\[/;

/**
 * MathJaxSvg parses its children as HTML before extracting TeX segments, so
 * raw `<`/`>`/`&` (common in inequality LaTeX like `\(x>2\)`) must be escaped
 * to entities first or they get misread as markup instead of text. HTML also
 * collapses plain `\n`, unlike RN's `<Text>`, so newlines are turned into
 * `<br/>` afterward to keep authored line breaks visible in both paths.
 */
function escapeForMathJax(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');
}

type MathTextProps = {
  text: string | null | undefined;
  className?: string;
  fontSize?: number;
  /**
   * Opens up spacing between lines — useful for multi-step explanations.
   * MathJaxSvg lays each `<br/>`-separated line out as its own wrapped flex
   * row rather than a single Text block, so RN's `lineHeight` (which the
   * plain-text path below uses) has no effect there; `rowGap` on its
   * container is the equivalent knob for that path.
   */
  looseLineHeight?: boolean;
};

/** Renders a string that may mix plain prose with inline `\( ... \)` LaTeX. */
export function MathText({ text, className, fontSize = 16, looseLineHeight = false }: MathTextProps) {
  const colors = useColors();
  if (!text) return null;

  if (!LATEX_DELIMITER_PATTERN.test(text)) {
    return (
      <Text className={className} style={looseLineHeight ? { lineHeight: fontSize * 1.6 } : undefined}>
        {text}
      </Text>
    );
  }

  return (
    <MathJaxSvg
      fontSize={fontSize}
      color={colors.ink}
      fontCache
      style={looseLineHeight ? { rowGap: fontSize * 0.6 } : undefined}>
      {escapeForMathJax(text)}
    </MathJaxSvg>
  );
}
