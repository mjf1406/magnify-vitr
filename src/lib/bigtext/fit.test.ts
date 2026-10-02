import { describe, expect, test } from "vite-plus/test";

import { fitText, type MeasureWidth } from "./fit";
import type { RichDoc } from "./types";

const measure: MeasureWidth = (text, font) => {
  const px = Number(/(\d+(?:\.\d+)?)px/.exec(font)?.[1] ?? "0");
  const weight = font.includes("700") ? 1.1 : 1;
  return text.length * px * 0.5 * weight;
};

function doc(text: string, extras?: { bold?: boolean; scale?: number }): RichDoc {
  return { paragraphs: [{ runs: [{ text, ...extras }] }] };
}

describe("fitText", () => {
  test("picks the largest size that fits one line", () => {
    const fitted = fitText({
      doc: doc("AAAA"),
      maxWidth: 200,
      maxHeight: 200,
      padding: 0,
      lineHeight: 1,
      fontFamily: "sans",
      measure,
    });
    expect(fitted.fontSize).toBe(100);
    expect(fitted.lines).toHaveLength(1);
    expect(fitted.lines[0]?.width).toBeCloseTo(200);
  });

  test("padding shrinks the fitted size", () => {
    const fitted = fitText({
      doc: doc("AAAA"),
      maxWidth: 200,
      maxHeight: 200,
      padding: 10,
      lineHeight: 1,
      fontFamily: "sans",
      measure,
    });
    expect(fitted.fontSize).toBe(90);
  });

  test("wraps words when a single line would be too tall", () => {
    const fitted = fitText({
      doc: doc("AA AA"),
      maxWidth: 100,
      maxHeight: 100,
      padding: 0,
      lineHeight: 1,
      fontFamily: "sans",
      measure,
    });
    expect(fitted.fontSize).toBe(50);
    expect(fitted.lines).toHaveLength(2);
  });

  test("a larger scale uses more width and line height", () => {
    const fitted = fitText({
      doc: doc("AA", { scale: 2 }),
      maxWidth: 200,
      maxHeight: 200,
      padding: 0,
      lineHeight: 1,
      fontFamily: "sans",
      measure,
    });
    expect(fitted.fontSize).toBe(100);
    expect(fitted.lines[0]?.lineHeight).toBe(200);
  });

  test("returns nothing when padding consumes the box", () => {
    const fitted = fitText({
      doc: doc("A"),
      maxWidth: 20,
      maxHeight: 20,
      padding: 12,
      lineHeight: 1,
      fontFamily: "sans",
      measure,
    });
    expect(fitted.fontSize).toBe(0);
    expect(fitted.lines).toEqual([]);
  });

  test("measures bold with a heavier font", () => {
    const fonts: string[] = [];
    const fitted = fitText({
      doc: doc("AAAA", { bold: true }),
      maxWidth: 200,
      maxHeight: 200,
      padding: 0,
      lineHeight: 1,
      fontFamily: "mono",
      measure: (text, font) => {
        fonts.push(font);
        return measure(text, font);
      },
    });
    expect(
      fonts.some((font) => font.includes("700") && font.includes("JetBrains Mono Variable")),
    ).toBe(true);
    expect(fitted.fontSize).toBe(90);
  });
});
