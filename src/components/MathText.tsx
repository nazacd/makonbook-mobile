import { Text } from 'react-native';
import { MathJaxSvg } from 'react-native-mathjax-html-to-svg';

const LATEX_DELIMITER_PATTERN = /\\\(|\\\[/;
const MATH_COLOR = '#f5f5f5';

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
  if (!text) return null;

  if (!LATEX_DELIMITER_PATTERN.test(text)) {
    return <Text className={className}>{text}</Text>;
  }

  return (
    <MathJaxSvg fontSize={fontSize} color={MATH_COLOR} fontCache>
      {escapeForMathJax(text)}
    </MathJaxSvg>
  );
}
