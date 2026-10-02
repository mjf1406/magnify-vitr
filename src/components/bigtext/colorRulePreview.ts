import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

import { applyColorRules } from "@/lib/bigtext/tokenize";
import type { ColorRule } from "@/lib/bigtext/types";
import { isHexColor } from "@/lib/bigtext/types";

const previewKey = new PluginKey("colorRulePreview");

export function colorRulePreview(getRules: () => ColorRule[]) {
  return Extension.create({
    name: "colorRulePreview",
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: previewKey,
          props: {
            decorations(state) {
              const rules = getRules();
              const decorations: Decoration[] = [];
              state.doc.descendants((node, pos) => {
                if (!node.isText || !node.text) return;
                const manual = node.marks.some((mark) => {
                  if (mark.type.name !== "textStyle") return false;
                  const color = mark.attrs.color;
                  return typeof color === "string" && isHexColor(color);
                });
                if (manual) return;
                const colored = applyColorRules(
                  { paragraphs: [{ runs: [{ text: node.text }] }] },
                  rules,
                );
                let offset = 0;
                for (const run of colored.paragraphs[0]?.runs ?? []) {
                  if (run.color && run.text.length > 0) {
                    decorations.push(
                      Decoration.inline(pos + offset, pos + offset + run.text.length, {
                        style: `color: ${run.color}`,
                      }),
                    );
                  }
                  offset += run.text.length;
                }
              });
              return DecorationSet.create(state.doc, decorations);
            },
          },
        }),
      ];
    },
  });
}
