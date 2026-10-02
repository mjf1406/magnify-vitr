import { EditorContent, useEditor } from "@tiptap/react";
import { BoldIcon, ItalicIcon, LightbulbIcon, UnderlineIcon } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { richDocToTiptap, tiptapToRichDoc } from "@/lib/bigtext/richDoc";
import { isHexColor, type ColorRule, type RichDoc } from "@/lib/bigtext/types";

import { ColorSwatch } from "./ColorSwatch";
import { bigTextExtensions } from "./editorExtensions";

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

const MARKS = ["bold", "italic", "underline"] as const;
type Mark = (typeof MARKS)[number];

const editorClass = "min-h-32 whitespace-pre-wrap px-3 py-3 text-sm outline-none";

function isMark(value: string): value is Mark {
  return value === "bold" || value === "italic" || value === "underline";
}

export const TextEditor = forwardRef<TextEditorHandle, TextEditorProps>(function TextEditor(
  { initialDoc, rules, onChange, selectAllToken = 0 },
  ref,
) {
  const { t } = useTranslation("bigtext");
  const onChangeRef = useRef(onChange);
  const rulesRef = useRef(rules);
  onChangeRef.current = onChange;

  const extensions = useMemo(() => bigTextExtensions(() => rulesRef.current), []);

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
  const activeMarks = MARKS.filter((mark) => editor?.isActive(mark) ?? false);

  function applyMarks(next: readonly string[]) {
    if (!editor) return;
    const wanted = new Set(next.filter(isMark));
    let chain = editor.chain().focus();
    if (editor.isActive("bold") !== wanted.has("bold")) chain = chain.toggleBold();
    if (editor.isActive("italic") !== wanted.has("italic")) chain = chain.toggleItalic();
    if (editor.isActive("underline") !== wanted.has("underline")) chain = chain.toggleUnderline();
    chain.run();
  }

  return (
    <div className="flex flex-col gap-2">
      <Alert variant="tip" role="note">
        <LightbulbIcon />
        <AlertDescription>{t("doubleClickEditTip")}</AlertDescription>
      </Alert>
      <div
        className="flex flex-wrap items-center gap-2"
        role="toolbar"
        aria-label={t("editorLabel")}
      >
        <ToggleGroup
          multiple
          variant="outline"
          size="sm"
          spacing={1}
          disabled={!editor}
          value={activeMarks}
          onValueChange={applyMarks}
        >
          <ToggleGroupItem value="bold" aria-label={t("bold")}>
            <BoldIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label={t("italic")}>
            <ItalicIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="underline" aria-label={t("underline")}>
            <UnderlineIcon />
          </ToggleGroupItem>
        </ToggleGroup>
        <ColorSwatch
          value={colorValue}
          label={t("textColor")}
          disabled={!editor}
          onChange={(next) => {
            editor?.chain().focus().setColor(next).run();
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!editor}
          onClick={() => editor?.chain().focus().unsetColor().run()}
        >
          {t("clearColor")}
        </Button>
      </div>
      <div className="rounded-xl border border-input bg-input/30 transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
});
