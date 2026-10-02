import { z } from "zod";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export const colorRuleKinds = [
  "numbers",
  "parentheses",
  "brackets",
  "braces",
  "quotes",
  "punctuation",
  "custom",
] as const;

export const colorRuleSchema = z.object({
  id: z.string().min(1).max(80),
  kind: z.enum(colorRuleKinds),
  chars: z.string().max(64).optional(),
  color: z.string().regex(HEX_COLOR),
  enabled: z.boolean(),
});

export const textRunSchema = z.object({
  text: z.string().max(8000),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  color: z.string().regex(HEX_COLOR).optional(),
  scale: z.number().min(0.5).max(4).optional(),
});

export const richDocSchema = z.object({
  paragraphs: z
    .array(
      z.object({
        runs: z.array(textRunSchema).max(500),
      }),
    )
    .min(1)
    .max(200),
});

export const fontFamilies = ["sans", "mono", "serif"] as const;

export const presetStyleSchema = z.object({
  fontFamily: z.enum(fontFamilies),
  backgroundColor: z.string().regex(HEX_COLOR),
  textColor: z.string().regex(HEX_COLOR),
  align: z.enum(["left", "center", "right"]),
  padding: z.number().min(0).max(240),
  lineHeight: z.number().min(0.8).max(2.5),
  colorRules: z.array(colorRuleSchema).max(24),
});

export const draftSchema = z.object({
  doc: richDocSchema,
  style: presetStyleSchema,
});

export type ColorRuleKind = z.infer<typeof colorRuleSchema>["kind"];
export type ColorRule = z.infer<typeof colorRuleSchema>;
export type TextRun = z.infer<typeof textRunSchema>;
export type RichParagraph = { runs: TextRun[] };
export type RichDoc = z.infer<typeof richDocSchema>;
export type FontFamilyId = z.infer<typeof presetStyleSchema>["fontFamily"];
export type TextAlign = z.infer<typeof presetStyleSchema>["align"];
export type PresetStyle = z.infer<typeof presetStyleSchema>;
export type BigTextDraft = z.infer<typeof draftSchema>;

export const FONT_STACKS: Record<FontFamilyId, { css: string; canvas: string }> = {
  sans: { css: '"Inter Variable", sans-serif', canvas: '"Inter Variable"' },
  mono: {
    css: '"JetBrains Mono Variable", ui-monospace, monospace',
    canvas: '"JetBrains Mono Variable"',
  },
  serif: { css: "Georgia, serif", canvas: "Georgia" },
};

export const SCALE_OPTIONS = [0.75, 1, 1.25, 1.5, 2] as const;

export function isHexColor(value: string): boolean {
  return HEX_COLOR.test(value);
}

export function defaultColorRules(): ColorRule[] {
  return [
    { id: "numbers", kind: "numbers", color: "#fb7185", enabled: true },
    { id: "parentheses", kind: "parentheses", color: "#38bdf8", enabled: true },
    { id: "brackets", kind: "brackets", color: "#34d399", enabled: true },
    { id: "braces", kind: "braces", color: "#fbbf24", enabled: true },
    { id: "quotes", kind: "quotes", color: "#c084fc", enabled: true },
    { id: "punctuation", kind: "punctuation", color: "#94a3b8", enabled: true },
  ];
}

export function defaultStyle(): PresetStyle {
  return {
    fontFamily: "sans",
    backgroundColor: "#111111",
    textColor: "#f8fafc",
    align: "center",
    padding: 32,
    lineHeight: 1.15,
    colorRules: defaultColorRules(),
  };
}

export function sampleDoc(): RichDoc {
  return {
    paragraphs: [{ runs: [{ text: "Hello (world) [123] {ok}" }] }],
  };
}

export function docIsEmpty(doc: RichDoc): boolean {
  return doc.paragraphs.every((paragraph) => paragraph.runs.every((run) => run.text.trim() === ""));
}

export function ruleLabelKey(
  kind: ColorRuleKind,
):
  | "ruleNumbers"
  | "ruleParentheses"
  | "ruleBrackets"
  | "ruleBraces"
  | "ruleQuotes"
  | "rulePunctuation"
  | "ruleCustom" {
  switch (kind) {
    case "numbers":
      return "ruleNumbers";
    case "parentheses":
      return "ruleParentheses";
    case "brackets":
      return "ruleBrackets";
    case "braces":
      return "ruleBraces";
    case "quotes":
      return "ruleQuotes";
    case "punctuation":
      return "rulePunctuation";
    case "custom":
      return "ruleCustom";
  }
}
