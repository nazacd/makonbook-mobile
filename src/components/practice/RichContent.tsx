import { memo, useState, type ReactNode } from 'react';
import { Image, Pressable, View, type TextStyle } from 'react-native';
import { MathJaxSvg } from 'react-native-mathjax-html-to-svg';

import { ImageViewerModal } from '@/components/ImageViewerModal';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import { imageUri } from '@/lib/practice/files';
import type { PackageImage } from '@/lib/practice/types';

// Draws the question content format (the API's spec 9.2, as the admin panel's
// RichText): paragraphs split by a blank line, \( \) and \[ \] math, *italic*,
// **bold**, <u>underline</u>, "- " lists, pipe tables, ![alt](r2:key) images.
//
// A paragraph is laid out as a wrapping row of words and formulas rather than
// one <Text>, so a formula sits in the line where it is written and the line
// breaks around it, as in print. Only formulas go through MathJax; text is
// never parsed as TeX, so "$29" stays a price.

const INLINE =
  /(\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|!\[[^\]]*\]\([^)\s]*\)|\*\*\*[\s\S]+?\*\*\*|\*\*[\s\S]+?\*\*|<u>[\s\S]*?<\/u>|\*(?![\s*])(?:[^*]|\*\*[^*]+?\*\*)*?\*(?!\*)|\n)/;

type Style = { bold?: boolean; italic?: boolean; underline?: boolean };

type Atom =
  | { kind: 'word'; text: string; style: Style }
  | { kind: 'math'; tex: string; display: boolean }
  | { kind: 'image'; key: string; alt: string }
  | { kind: 'break' };

function atoms(src: string, style: Style = {}): Atom[] {
  const out: Atom[] = [];
  src.split(INLINE).forEach((part, i) => {
    if (!part) return;
    if (i % 2 === 0) {
      // Each word with the space after it, so lines can break between words.
      for (const w of part.match(/\S+\s*|\s+/g) ?? []) out.push({ kind: 'word', text: w, style });
    } else if (part === '\n') out.push({ kind: 'break' });
    else if (part.startsWith('\\(')) out.push({ kind: 'math', tex: part.slice(2, -2), display: false });
    else if (part.startsWith('\\[')) out.push({ kind: 'math', tex: part.slice(2, -2), display: true });
    else if (part.startsWith('![')) {
      const m = /^!\[([^\]]*)\]\(([^)\s]*)\)$/.exec(part);
      if (m && m[2]!.startsWith('r2:')) out.push({ kind: 'image', key: m[2]!.slice(3), alt: m[1]! });
      else if (m) out.push({ kind: 'word', text: `[${m[1]}] `, style });
    } else if (part.startsWith('***')) out.push(...atoms(part.slice(3, -3), { ...style, bold: true, italic: true }));
    else if (part.startsWith('**')) out.push(...atoms(part.slice(2, -2), { ...style, bold: true }));
    else if (part.startsWith('<u>')) out.push(...atoms(part.slice(3, -4), { ...style, underline: true }));
    else out.push(...atoms(part.slice(1, -1), { ...style, italic: true }));
  });
  return out;
}

// MathJaxSvg reads its input as HTML first.
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const Formula = memo(function Formula({ tex, display, fontSize, color }: { tex: string; display: boolean; fontSize: number; color: string }) {
  // Choices and display formulas draw fractions full size, as Bluebook does.
  const body = display ? `\\displaystyle ${tex}` : tex;
  return (
    <MathJaxSvg fontSize={fontSize} color={color} fontCache>
      {`\\(${escapeHtml(body)}\\)`}
    </MathJaxSvg>
  );
});

type Ctx = {
  fontSize: number;
  color: string;
  images: Record<string, PackageImage>;
  displayMath: boolean;
};

function Figure({ imageKey, alt, ctx }: { imageKey: string; alt: string; ctx: Ctx }) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const img = ctx.images[imageKey];
  if (!img) {
    return (
      <Text variant="footnote" style={{ color: colors.ink2 }}>
        [{alt || 'image'}]
      </Text>
    );
  }
  const source = { uri: imageUri(img.file) };
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="imagebutton"
        accessibilityLabel={alt || 'Figure'}
        accessibilityHint="Opens the image full screen"
        className="overflow-hidden rounded-xl bg-white"
        style={{ width: '100%', aspectRatio: img.width / img.height, maxHeight: 420 }}>
        <Image source={source} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
      </Pressable>
      <ImageViewerModal visible={open} source={source} onClose={() => setOpen(false)} />
    </>
  );
}

function Inline({ src, ctx }: { src: string; ctx: Ctx }) {
  const lineHeight = Math.round(ctx.fontSize * 1.5);
  const rows: ReactNode[] = [];
  let line: ReactNode[] = [];
  const flush = () => {
    if (line.length) {
      rows.push(
        <View key={rows.length} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
          {line}
        </View>,
      );
    }
    line = [];
  };
  atoms(src).forEach((a, i) => {
    if (a.kind === 'word') {
      const style: TextStyle = {
        fontSize: ctx.fontSize,
        lineHeight,
        color: ctx.color,
        fontWeight: a.style.bold ? '700' : undefined,
        fontStyle: a.style.italic ? 'italic' : undefined,
        textDecorationLine: a.style.underline ? 'underline' : undefined,
      };
      line.push(
        <Text key={i} style={style}>
          {a.text}
        </Text>,
      );
    } else if (a.kind === 'math' && !a.display) {
      line.push(
        <View key={i} style={{ minHeight: lineHeight, justifyContent: 'center', marginRight: 3 }}>
          <Formula tex={a.tex} display={ctx.displayMath} fontSize={ctx.fontSize} color={ctx.color} />
        </View>,
      );
    } else if (a.kind === 'math') {
      flush();
      rows.push(
        <View key={`d${i}`} style={{ alignItems: 'center', paddingVertical: 6 }}>
          <Formula tex={a.tex} display fontSize={ctx.fontSize} color={ctx.color} />
        </View>,
      );
    } else if (a.kind === 'image') {
      flush();
      rows.push(
        <View key={`i${i}`} style={{ paddingVertical: 6 }}>
          <Figure imageKey={a.key} alt={a.alt} ctx={ctx} />
        </View>,
      );
    } else {
      flush();
    }
  });
  flush();
  return <View>{rows}</View>;
}

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim());

type RichContentProps = {
  text: string | null | undefined;
  images: Record<string, PackageImage>;
  fontSize?: number;
  color?: string;
  /** Inline math at full size (answer choices). */
  displayMath?: boolean;
};

export const RichContent = memo(function RichContent({
  text,
  images,
  fontSize = 16,
  color: colorProp,
  displayMath = false,
}: RichContentProps) {
  const colors = useColors();
  if (!text) return null;
  const color = colorProp ?? colors.ink;
  const ctx: Ctx = { fontSize, color, images, displayMath };
  const blocks = text.trim().split(/\n[ \t]*\n/);
  return (
    <View style={{ gap: Math.round(fontSize * 0.75) }}>
      {blocks.map((block, i) => {
        if (block.trim() === '') return <View key={i} style={{ height: fontSize }} />;
        const lines = block.split('\n');
        if (lines.length > 1 && lines.every((l) => l.trim().startsWith('|'))) {
          const rows = lines.filter((l) => !/^\s*\|?\s*:?-{2,}/.test(l)).map(cells);
          return (
            <View key={i} className="overflow-hidden rounded-lg" style={{ borderWidth: 1, borderColor: colors.lineStrong }}>
              {rows.map((row, r) => (
                <View
                  key={r}
                  style={{
                    flexDirection: 'row',
                    borderTopWidth: r ? 1 : 0,
                    borderColor: colors.lineStrong,
                    backgroundColor: r === 0 ? colors.surface2 : undefined,
                  }}>
                  {row.map((c, j) => (
                    <View
                      key={j}
                      style={{ flex: 1, padding: 8, borderLeftWidth: j ? 1 : 0, borderColor: colors.lineStrong }}>
                      <Inline src={r === 0 && c ? `**${c}**` : c} ctx={{ ...ctx, fontSize: fontSize - 2 }} />
                    </View>
                  ))}
                </View>
              ))}
            </View>
          );
        }
        if (lines.every((l) => l.startsWith('- '))) {
          return (
            <View key={i} style={{ gap: 4 }}>
              {lines.map((l, j) => (
                <View key={j} style={{ flexDirection: 'row', gap: 8 }}>
                  <Text style={{ fontSize, lineHeight: Math.round(fontSize * 1.5), color }}>•</Text>
                  <View style={{ flex: 1 }}>
                    <Inline src={l.slice(2)} ctx={ctx} />
                  </View>
                </View>
              ))}
            </View>
          );
        }
        return <Inline key={i} src={block} ctx={ctx} />;
      })}
    </View>
  );
});
