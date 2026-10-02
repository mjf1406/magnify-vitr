import { Mark, mergeAttributes } from "@tiptap/core";

export const Scale = Mark.create({
  name: "scale",

  addAttributes() {
    return {
      scale: {
        default: 1,
        parseHTML: (element) => {
          const value = Number(element.getAttribute("data-scale"));
          return Number.isFinite(value) ? value : 1;
        },
        renderHTML: (attributes) => {
          const scale = typeof attributes.scale === "number" ? attributes.scale : 1;
          return {
            "data-scale": String(scale),
            style: `font-size: ${scale}em`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-scale]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
});
