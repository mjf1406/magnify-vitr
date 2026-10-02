import type { FontFamilyId, RichDoc, TextRun } from "./types";
import { FONT_STACKS } from "./types";

/** Width of `text` drawn with a canvas font string, in CSS pixels. */
export type MeasureWidth = (text: string, font: string) => number;

export type FittedFragment = {
  text: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  scale: number;
};

export type FittedLine = {
  fragments: FittedFragment[];
  width: number;
  lineHeight: number;
};

export type FitResult = {
  fontSize: number;
  lines: FittedLine[];
};

const REFERENCE_PX = 100;
const WIDTH_EPSILON = 0.01;
const MAX_FONT_PX = 4000;

type Atom = {
  text: string;
  isSpace: boolean;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  scale: number;
  unitWidth: number;
};

function referenceFont(family: string, bold?: boolean, italic?: boolean): string {
  return `${italic ? "italic" : "normal"} ${bold ? 700 : 400} ${REFERENCE_PX}px ${family}`;
}

function scaleOf(run: TextRun): number {
  if (run.scale === undefined || !Number.isFinite(run.scale)) return 1;
  return Math.min(4, Math.max(0.5, run.scale));
}

function sameLook(left: FittedFragment, right: FittedFragment): boolean {
  return (
    left.color === right.color &&
    left.bold === right.bold &&
    left.italic === right.italic &&
    left.underline === right.underline &&
    left.scale === right.scale
  );
}

function mergeFragments(fragments: FittedFragment[]): FittedFragment[] {
  const merged: FittedFragment[] = [];
  for (const fragment of fragments) {
    const previous = merged[merged.length - 1];
    if (previous && sameLook(previous, fragment)) {
      previous.text += fragment.text;
    } else {
      merged.push({ ...fragment });
    }
  }
  return merged;
}

function atomsForParagraph(runs: TextRun[], canvasFamily: string, measure: MeasureWidth): Atom[] {
  const atoms: Atom[] = [];
  for (const run of runs) {
    const pieces = run.text.split(/(\s+)/);
    const scale = scaleOf(run);
    for (const piece of pieces) {
      if (!piece) continue;
      const isSpace = /^\s+$/.test(piece);
      const measured = measure(piece, referenceFont(canvasFamily, run.bold, run.italic));
      const unitWidth = (measured / REFERENCE_PX) * scale;
      atoms.push({
        text: piece,
        isSpace,
        color: run.color,
        bold: run.bold,
        italic: run.italic,
        underline: run.underline,
        scale,
        unitWidth,
      });
    }
  }
  return atoms;
}

function expandParagraphs(doc: RichDoc): TextRun[][] {
  const paragraphs: TextRun[][] = [];
  for (const paragraph of doc.paragraphs) {
    let current: TextRun[] = [];
    const flush = () => {
      paragraphs.push(current);
      current = [];
    };
    for (const run of paragraph.runs) {
      const parts = run.text.split("\n");
      parts.forEach((part, index) => {
        if (part.length > 0) current.push({ ...run, text: part });
        if (index < parts.length - 1) flush();
      });
    }
    flush();
  }
  return paragraphs.length > 0 ? paragraphs : [[]];
}

type LayoutAttempt = { ok: true; lines: FittedLine[] } | { ok: false };

function layoutAt(
  paragraphs: Atom[][],
  fontSize: number,
  innerWidth: number,
  innerHeight: number,
  lineHeight: number,
): LayoutAttempt {
  const lines: FittedLine[] = [];

  for (const atoms of paragraphs) {
    const linesBefore = lines.length;
    let current: FittedFragment[] = [];
    let width = 0;
    let maxScale = 1;

    const commit = () => {
      lines.push({
        fragments: mergeFragments(current),
        width,
        lineHeight: fontSize * lineHeight * maxScale,
      });
      current = [];
      width = 0;
      maxScale = 1;
    };

    for (const atom of atoms) {
      const atomWidth = atom.unitWidth * fontSize;
      if (atom.isSpace) {
        if (current.length === 0) continue;
        if (width + atomWidth > innerWidth + WIDTH_EPSILON) {
          commit();
        } else {
          current.push({
            text: atom.text,
            color: atom.color,
            bold: atom.bold,
            italic: atom.italic,
            underline: atom.underline,
            scale: atom.scale,
          });
          width += atomWidth;
        }
        continue;
      }
      if (atomWidth > innerWidth + WIDTH_EPSILON) return { ok: false };
      if (current.length > 0 && width + atomWidth > innerWidth + WIDTH_EPSILON) commit();
      current.push({
        text: atom.text,
        color: atom.color,
        bold: atom.bold,
        italic: atom.italic,
        underline: atom.underline,
        scale: atom.scale,
      });
      width += atomWidth;
      maxScale = Math.max(maxScale, atom.scale);
    }

    if (current.length > 0) commit();
    else if (lines.length === linesBefore) {
      lines.push({ fragments: [], width: 0, lineHeight: fontSize * lineHeight });
    }
  }

  const totalHeight = lines.reduce((sum, line) => sum + line.lineHeight, 0);
  if (totalHeight > innerHeight + WIDTH_EPSILON) return { ok: false };
  return { ok: true, lines };
}

export function fitText(options: {
  doc: RichDoc;
  maxWidth: number;
  maxHeight: number;
  padding: number;
  lineHeight: number;
  fontFamily: FontFamilyId;
  measure: MeasureWidth;
}): FitResult {
  const innerWidth = options.maxWidth - options.padding * 2;
  const innerHeight = options.maxHeight - options.padding * 2;
  if (innerWidth <= 0 || innerHeight <= 0) return { fontSize: 0, lines: [] };

  const canvasFamily = FONT_STACKS[options.fontFamily].canvas;
  const paragraphs = expandParagraphs(options.doc).map((runs) =>
    atomsForParagraph(runs, canvasFamily, options.measure),
  );

  let low = 1;
  let high = Math.min(MAX_FONT_PX, Math.floor(Math.max(innerWidth, innerHeight)));
  let bestSize = 0;
  let bestLines: FittedLine[] = [];

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const laid = layoutAt(paragraphs, mid, innerWidth, innerHeight, options.lineHeight);
    if (laid.ok) {
      bestSize = mid;
      bestLines = laid.lines;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  if (bestSize === 0) {
    return {
      fontSize: 1,
      lines: [{ fragments: [], width: 0, lineHeight: options.lineHeight }],
    };
  }

  return { fontSize: bestSize, lines: bestLines };
}
