import { describe, expect, test } from "vite-plus/test";

import { richDocToTiptap, tiptapToRichDoc } from "./richDoc";
import type { RichDoc } from "./types";

describe("richDoc", () => {
  test("round-trips marks, color, scale, and paragraphs", () => {
    const doc: RichDoc = {
      paragraphs: [
        {
          runs: [
            { text: "Hello ", bold: true },
            { text: "(world)", italic: true, color: "#112233", scale: 1.5 },
            { text: "!", underline: true },
          ],
        },
        { runs: [] },
        { runs: [{ text: "Next" }] },
      ],
    };

    expect(tiptapToRichDoc(richDocToTiptap(doc))).toEqual(doc);
  });

  test("rejects unknown input as an empty paragraph", () => {
    expect(tiptapToRichDoc(null)).toEqual({ paragraphs: [{ runs: [] }] });
  });
});
