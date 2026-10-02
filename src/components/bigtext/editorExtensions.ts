import type { Extensions } from "@tiptap/core";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import StarterKit from "@tiptap/starter-kit";

import type { ColorRule } from "@/lib/bigtext/types";

import { colorRulePreview } from "./colorRulePreview";
import { Scale } from "./scaleMark";

export function bigTextExtensions(getRules: () => ColorRule[]): Extensions {
  return [
    StarterKit.configure({
      blockquote: false,
      bulletList: false,
      code: false,
      codeBlock: false,
      dropcursor: false,
      gapcursor: false,
      heading: false,
      horizontalRule: false,
      link: false,
      listItem: false,
      listKeymap: false,
      orderedList: false,
      strike: false,
    }),
    TextStyle,
    Color,
    Scale,
    colorRulePreview(getRules),
  ];
}
