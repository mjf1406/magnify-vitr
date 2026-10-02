import { EditorContent, useEditor } from "@tiptap/react";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import StarterKit from "@tiptap/starter-kit";
import { BoldIcon, ItalicIcon, UnderlineIcon } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { richDocToTiptap, tiptapToRichDoc } from "@/lib/bigtext/richDoc";
import { SCALE_OPTIONS, isHexColor, type ColorRule, type RichDoc } from "@/lib/bigtext/types";

import { colorRulePreview } from "./colorRulePreview";
import { Scale } from "./scaleMark";

export type TextEditorHandle = {
  load: (doc: RichDoc) => void;
};

type TextEditorProps = {
  initialDoc: RichDoc;
  rules: ColorRule[];
  onChange: (doc: RichDoc) => void;
  /** Changes when the mobile text drawer opens. Focuses the editor and selects its text. */
  selectAllToken?: number;
};

const editorClass = "min-h-32 whitespace-pre-wrap px-3 py-2 text-sm outline-none";

export const TextEditor = forwardRef<TextEditorHandle, TextEditorProps>(function TextEditor(
  { initialDoc, rules, onChange, selectAllToken = 0 },
  ref,
) {
  const { t } = useTranslation("bigtext");
  const onChangeRef = useRef(onChange);
  const rulesRef = useRef(rules);
  onChangeRef.current = onChange;

  const extensions = useMemo(
    () => [
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
      colorRulePreview(() => rulesRef.current),
    ],
    [],
  );

  const editor = useEditor({
    extensions,
    immediatelyRender: true,
    content: richDocToTiptap(initialDoc),
    editorProps: {
      attributes: {
        "aria-label": t("editorLabel"),
        class: editorClass,
      },
    },
    onUpdate: ({ editor: current }) => {
      onChangeRef.current(tiptapToRichDoc(current.getJSON()));
    },
  });

  useImperativeHandle(
    ref,
    () => ({
      load(doc) {
        editor?.commands.setContent(richDocToTiptap(doc), { emitUpdate: false });
      },
    }),
    [editor],
  );

  useEffect(() => {
    rulesRef.current = rules;
    if (!editor) return;
    editor.view.dispatch(editor.state.tr.setMeta("colorRules", true));
  }, [editor, rules]);

  useEffect(() => {
    if (!selectAllToken || !editor) return;
    const timer = window.setTimeout(() => {
      editor.chain().focus().selectAll().run();
    }, 50);
    return () => window.clearTimeout(timer);
  }, [selectAllToken, editor]);

  useEffect(() => {
    editor?.setOptions({
      editorProps: {
        attributes: {
          "aria-label": t("editorLabel"),
          class: editorClass,
        },
      },
    });
  }, [editor, t]);

  const currentColor = editor?.getAttributes("textStyle").color;
  const colorValue =
    typeof currentColor === "string" && isHexColor(currentColor) ? currentColor : "#111111";
  const currentScale = editor?.getAttributes("scale").scale;
  const scaleValue = typeof currentScale === "number" ? currentScale : 1;

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex flex-wrap items-center gap-1"
        role="toolbar"
        aria-label={t("editorLabel")}
      >
        <Button
          type="button"
          size="icon-sm"
          variant={editor?.isActive("bold") ? "secondary" : "outline"}
          aria-pressed={editor?.isActive("bold") ?? false}
          aria-label={t("bold")}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <BoldIcon />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant={editor?.isActive("italic") ? "secondary" : "outline"}
          aria-pressed={editor?.isActive("italic") ?? false}
          aria-label={t("italic")}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <ItalicIcon />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant={editor?.isActive("underline") ? "secondary" : "outline"}
          aria-pressed={editor?.isActive("underline") ?? false}
          aria-label={t("underline")}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon />
        </Button>
        <label className="ml-1 flex items-center gap-1 text-xs text-muted-foreground">
          <span className="sr-only">{t("textColor")}</span>
          <input
            type="color"
            aria-label={t("textColor")}
            value={colorValue}
            disabled={!editor}
            className="size-8 cursor-pointer rounded-full border border-border bg-transparent p-0.5"
            onChange={(event) => {
              const next = event.target.value;
              if (!isHexColor(next)) return;
              editor?.chain().focus().setColor(next).run();
            }}
          />
        </label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!editor}
          onClick={() => editor?.chain().focus().unsetColor().run()}
        >
          {t("clearColor")}
        </Button>
        <label className="ml-1 flex items-center gap-1 text-xs text-muted-foreground">
          {t("size")}
          <select
            aria-label={t("size")}
            className="h-8 rounded-4xl border border-input bg-input/30 px-2 text-sm text-foreground"
            value={String(scaleValue)}
            disabled={!editor}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (next === 1) editor?.chain().focus().unsetMark("scale").run();
              else editor?.chain().focus().setMark("scale", { scale: next }).run();
            }}
          >
            {SCALE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {Math.round(option * 100)}%
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="rounded-2xl border border-input bg-input/30">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
});
