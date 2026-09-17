import { Text } from 'react-native';
import { MathJaxSvg } from 'react-native-mathjax-html-to-svg';

import { useColorScheme } from '@/hooks/use-color-scheme';

const LATEX_DELIMITER_PATTERN = /\\\(|\\\[/;

/**
 * MathJaxSvg parses its children as HTML before extracting TeX segments, so
 * raw `<`/`>`/`&` (common in inequality LaTeX like `\(x>2\)`) must be escaped
 * to entities first or they get misread as markup instead of text.
 */
function escapeForMathJax(input: string): string {
  return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

type MathTextProps = {
  text: string | null | undefined;
  className?: string;
  fontSize?: number;
};

/** Renders a string that may mix plain prose with inline `\( ... \)` LaTeX. */
export function MathText({ text, className, fontSize = 16 }: MathTextProps) {
  const colorScheme = useColorScheme();

  if (!text) return null;

  if (!LATEX_DELIMITER_PATTERN.test(text)) {
    return <Text className={className}>{text}</Text>;
  }

  const color = colorScheme === 'dark' ? '#ffffff' : '#000000';

  return (
    <MathJaxSvg fontSize={fontSize} color={color} fontCache>
      {escapeForMathJax(text)}
    </MathJaxSvg>
  );
}
