import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

import { richDocToTiptap, tiptapToRichDoc } from "@/lib/bigtext/richDoc";
import type { ColorRule, RichDoc, TextAlign } from "@/lib/bigtext/types";

import { bigTextExtensions } from "./editorExtensions";

type InlineTextEditorProps = {
  doc: RichDoc;
  rules: ColorRule[];
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  textAlign: TextAlign;
  color: string;
  onChange: (doc: RichDoc) => void;
  onDone: () => void;
};

const editorClass = "w-full whitespace-pre-wrap outline-none";

export function InlineTextEditor({
  doc,
  rules,
  fontSize,
  fontFamily,
  lineHeight,
  textAlign,
  color,
  onChange,
  onDone,
}: InlineTextEditorProps) {
  const { t } = useTranslation("bigtext");
  const onChangeRef = useRef(onChange);
  const onDoneRef = useRef(onDone);
  const rulesRef = useRef(rules);
  onChangeRef.current = onChange;
  onDoneRef.current = onDone;

  const extensions = useMemo(() => bigTextExtensions(() => rulesRef.current), []);
  const editorProps = useMemo(
    () => ({
      attributes: {
        "aria-label": t("editorLabel"),
        class: editorClass,
      },
      handleKeyDown: (_view: unknown, event: KeyboardEvent) => {
        if (event.key !== "Escape") return false;
        onDoneRef.current();
        return true;
      },
    }),
    [t],
  );

  const editor = useEditor({
    extensions,
    immediatelyRender: true,
    content: richDocToTiptap(doc),
    editorProps,
    onUpdate: ({ editor: current }) => {
      onChangeRef.current(tiptapToRichDoc(current.getJSON()));
    },
  });

  useEffect(() => {
    rulesRef.current = rules;
    if (!editor) return;
    editor.view.dispatch(editor.state.tr.setMeta("colorRules", true));
  }, [editor, rules]);

  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    let armed = false;
    const timer = window.setTimeout(() => {
      editor.chain().focus().selectAll().run();
      armed = true;
    }, 0);

    function finishIfOutside(target: EventTarget | null) {
      if (!armed || editor.isDestroyed || !(target instanceof Node)) return;
      if (dom.contains(target)) return;
      onDoneRef.current();
    }

    function onPointerDown(event: PointerEvent) {
      finishIfOutside(event.target);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    dom.style.fontFamily = fontFamily;
    dom.style.fontSize = `${fontSize}px`;
    dom.style.lineHeight = String(lineHeight);
    dom.style.textAlign = textAlign;
    dom.style.color = color;
  }, [editor, fontFamily, fontSize, lineHeight, textAlign, color]);

  return <EditorContent editor={editor} className="w-full" />;
}
