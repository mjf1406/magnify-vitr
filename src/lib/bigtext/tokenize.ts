import type { ColorRule, RichDoc, TextRun } from "./types";
import { isHexColor } from "./types";

const QUOTES = new Set(['"', "'", "`", "“", "”", "‘", "’", "«", "»"]);
const PUNCTUATION = new Set([
  ".",
  ",",
  ";",
  ":",
  "!",
  "?",
  "…",
  "—",
  "–",
  "-",
  "_",
  "/",
  "\\",
  "|",
  "@",
  "#",
  "%",
  "&",
  "*",
  "+",
  "=",
  "<",
  ">",
  "~",
  "^",
]);

function isDigit(char: string): boolean {
  return char >= "0" && char <= "9";
}

function ruleMatches(rule: ColorRule, char: string, prev: string, next: string): boolean {
  switch (rule.kind) {
    case "numbers":
      return isDigit(char) || ((char === "." || char === ",") && isDigit(prev) && isDigit(next));
    case "parentheses":
      return char === "(" || char === ")";
    case "brackets":
      return char === "[" || char === "]";
    case "braces":
      return char === "{" || char === "}";
    case "quotes":
      return QUOTES.has(char);
    case "punctuation":
      return PUNCTUATION.has(char);
    case "custom":
      return Boolean(rule.chars && rule.chars.includes(char));
    default:
      return false;
  }
}

function colorForChar(
  rules: ColorRule[],
  char: string,
  prev: string,
  next: string,
): string | undefined {
  for (const rule of rules) {
    if (!rule.enabled || !isHexColor(rule.color)) continue;
    if (ruleMatches(rule, char, prev, next)) return rule.color;
  }
  return undefined;
}

function splitRun(run: TextRun, rules: ColorRule[]): TextRun[] {
  if (run.color || run.text.length === 0) return [run];

  const chars = Array.from(run.text);
  const parts: TextRun[] = [];
  let buffer = "";
  let bufferColor: string | undefined;

  const flush = () => {
    if (!buffer) return;
    const next: TextRun = { ...run, text: buffer };
    if (bufferColor) next.color = bufferColor;
    else delete next.color;
    parts.push(next);
    buffer = "";
  };

  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index] ?? "";
    const color = colorForChar(rules, char, chars[index - 1] ?? "", chars[index + 1] ?? "");
    if (buffer && color !== bufferColor) flush();
    bufferColor = color;
    buffer += char;
  }
  flush();
  return parts.length > 0 ? parts : [run];
}

/** Paint automatic colors onto a document. A run that already has a color is left as-is. */
export function applyColorRules(doc: RichDoc, rules: ColorRule[]): RichDoc {
  return {
    paragraphs: doc.paragraphs.map((paragraph) => ({
      runs: paragraph.runs.flatMap((run) => splitRun(run, rules)),
    })),
  };
}
