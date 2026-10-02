import { clampTextScale, isHexColor, type RichDoc, type TextRun } from "./types";

type JsonRecord = Record<string, unknown>;

export type TiptapDoc = {
  type: "doc";
  content: TiptapParagraph[];
};

type TiptapParagraph = {
  type: "paragraph";
  content?: TiptapText[];
};

type TiptapText = {
  type: "text";
  text: string;
  marks?: TiptapMark[];
};

type TiptapMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clampScale(value: number): number | undefined {
  const scale = clampTextScale(value);
  if (!Number.isFinite(value) || scale === 1) return undefined;
  return scale;
}

function marksForRun(run: TextRun): TiptapMark[] | undefined {
  const marks: TiptapMark[] = [];
  if (run.bold) marks.push({ type: "bold" });
  if (run.italic) marks.push({ type: "italic" });
  if (run.underline) marks.push({ type: "underline" });
  if (run.color && isHexColor(run.color))
    marks.push({ type: "textStyle", attrs: { color: run.color } });
  if (run.scale !== undefined && run.scale !== 1) {
    marks.push({ type: "scale", attrs: { scale: run.scale } });
  }
  return marks.length > 0 ? marks : undefined;
}

export function richDocToTiptap(doc: RichDoc): TiptapDoc {
  return {
    type: "doc",
    content: doc.paragraphs.map((paragraph) => {
      const content = paragraph.runs
        .filter((run) => run.text.length > 0 && !run.text.includes("\n"))
        .map((run) => {
          const marks = marksForRun(run);
          const node: TiptapText = { type: "text", text: run.text };
          if (marks) node.marks = marks;
          return node;
        });
      const block: TiptapParagraph = { type: "paragraph" };
      if (content.length > 0) block.content = content;
      return block;
    }),
  };
}

function runFromText(text: string, marks: unknown): TextRun {
  const run: TextRun = { text };
  if (!Array.isArray(marks)) return run;
  for (const mark of marks) {
    if (!isRecord(mark) || typeof mark.type !== "string") continue;
    if (mark.type === "bold") run.bold = true;
    if (mark.type === "italic") run.italic = true;
    if (mark.type === "underline") run.underline = true;
    if (mark.type === "textStyle" && isRecord(mark.attrs)) {
      const color = mark.attrs.color;
      if (typeof color === "string" && isHexColor(color)) run.color = color;
    }
    if (mark.type === "scale" && isRecord(mark.attrs) && typeof mark.attrs.scale === "number") {
      const scale = clampScale(mark.attrs.scale);
      if (scale !== undefined) run.scale = scale;
    }
  }
  return run;
}

function paragraphFromContent(content: unknown): RichDoc["paragraphs"] {
  if (!Array.isArray(content)) return [{ runs: [] }];
  const paragraphs: RichDoc["paragraphs"] = [{ runs: [] }];
  const pushBreak = () => {
    paragraphs.push({ runs: [] });
  };
  for (const node of content) {
    if (!isRecord(node) || typeof node.type !== "string") continue;
    const current = paragraphs[paragraphs.length - 1] ?? { runs: [] };
    if (node.type === "hardBreak") {
      pushBreak();
      continue;
    }
    if (node.type !== "text" || typeof node.text !== "string") continue;
    const pieces = node.text.split("\n");
    pieces.forEach((piece, index) => {
      const target = paragraphs[paragraphs.length - 1] ?? current;
      if (piece.length > 0) target.runs.push(runFromText(piece, node.marks));
      if (index < pieces.length - 1) pushBreak();
    });
  }
  return paragraphs;
}

export function tiptapToRichDoc(json: unknown): RichDoc {
  if (!isRecord(json) || json.type !== "doc" || !Array.isArray(json.content)) {
    return { paragraphs: [{ runs: [] }] };
  }
  const paragraphs: RichDoc["paragraphs"] = [];
  for (const block of json.content) {
    if (!isRecord(block) || block.type !== "paragraph") continue;
    paragraphs.push(...paragraphFromContent(block.content));
  }
  if (paragraphs.length === 0) return { paragraphs: [{ runs: [] }] };
  return { paragraphs };
}
