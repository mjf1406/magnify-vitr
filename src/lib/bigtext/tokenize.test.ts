import { describe, expect, test } from "vite-plus/test";

import { applyColorRules } from "./tokenize";
import { defaultColorRules, type ColorRule, type RichDoc } from "./types";

function doc(text: string, color?: string): RichDoc {
  return { paragraphs: [{ runs: [{ text, ...(color ? { color } : {}) }] }] };
}

function painted(text: string, rules: ColorRule[] = defaultColorRules()): string {
  return (
    applyColorRules(doc(text), rules)
      .paragraphs[0]?.runs.map((run) => `${run.text}:${run.color ?? "-"}`)
      .join("|") ?? ""
  );
}

describe("applyColorRules", () => {
  test("colors numbers, parentheses, brackets, braces, quotes, and punctuation", () => {
    const rules = defaultColorRules();
    const number = rules.find((rule) => rule.kind === "numbers")?.color;
    const paren = rules.find((rule) => rule.kind === "parentheses")?.color;
    const bracket = rules.find((rule) => rule.kind === "brackets")?.color;
    const brace = rules.find((rule) => rule.kind === "braces")?.color;
    const quote = rules.find((rule) => rule.kind === "quotes")?.color;
    const punct = rules.find((rule) => rule.kind === "punctuation")?.color;

    expect(painted("12")).toBe(`12:${number}`);
    expect(painted("3.14")).toBe(`3.14:${number}`);
    expect(painted("(a)")).toBe(`(:${paren}|a:-|):${paren}`);
    expect(painted("[a]")).toBe(`[:${bracket}|a:-|]:${bracket}`);
    expect(painted("{a}")).toBe(`{:${brace}|a:-|}:${brace}`);
    expect(painted('"a"')).toBe(`":${quote}|a:-|":${quote}`);
    expect(painted("a!")).toBe(`a:-|!:${punct}`);
  });

  test("a manual color overrides rules for the whole run", () => {
    const colored = applyColorRules(doc("(12)", "#112233"), defaultColorRules());
    expect(colored.paragraphs[0]?.runs).toEqual([{ text: "(12)", color: "#112233" }]);
  });

  test("an earlier custom rule wins over a built-in rule", () => {
    const rules: ColorRule[] = [
      { id: "custom", kind: "custom", chars: "12", color: "#abcdef", enabled: true },
      ...defaultColorRules(),
    ];
    expect(painted("12", rules)).toBe("12:#abcdef");
  });

  test("a disabled rule does not paint", () => {
    const rules = defaultColorRules().map((rule) =>
      rule.kind === "numbers" ? { ...rule, enabled: false } : rule,
    );
    expect(painted("12", rules)).toBe("12:-");
  });
});
