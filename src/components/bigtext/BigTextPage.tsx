import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BookmarkIcon, MessagesSquareIcon, PencilIcon, SlidersHorizontalIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/components/theme/theme-context";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useDraft } from "@/hooks/bigtext/useDraft";
import { useIsMobile } from "@/hooks/use-mobile";
import { loadDraft } from "@/lib/bigtext/draft";
import {
  applyThemeColors,
  defaultStyle,
  sampleDoc,
  type PresetStyle,
  type RichDoc,
} from "@/lib/bigtext/types";
import type { SavedPreset } from "@/hooks/presets/usePresets";

import { BigTextDisplay } from "./BigTextDisplay";
import { ColorRulesPanel } from "./ColorRulesPanel";
import { PresetMenu } from "./PresetMenu";
import { StyleControls } from "./StyleControls";
import { TextEditor, type TextEditorHandle } from "./TextEditor";

export function BigTextPage() {
  const { t } = useTranslation("bigtext");
  const { resolvedTheme } = useTheme();
  const isMobile = useIsMobile();
  const [snapshot] = useState(loadDraft);
  const [doc, setDoc] = useState<RichDoc>(snapshot?.doc ?? sampleDoc());
  const [style, setStyle] = useState<PresetStyle>(() =>
    applyThemeColors(snapshot?.style ?? defaultStyle(), resolvedTheme),
  );
  const [name, setName] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [textOpen, setTextOpen] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [selectAllToken, setSelectAllToken] = useState(0);
  const editorRef = useRef<TextEditorHandle>(null);
  const docRef = useRef(doc);
  docRef.current = doc;
  useDraft(doc, style);

  function changeDoc(next: RichDoc) {
    docRef.current = next;
    setDoc(next);
  }

  function finishInlineEdit() {
    editorRef.current?.load(docRef.current);
  }

  useEffect(() => {
    setStyle((current) => applyThemeColors(current, resolvedTheme));
  }, [resolvedTheme]);

  function loadPreset(preset: SavedPreset) {
    setDoc(preset.doc);
    setStyle(preset.style);
    setName(preset.name);
    setActiveId(preset.id);
    editorRef.current?.load(preset.doc);
    setPresetsOpen(false);
  }

  const editor = (
    <TextEditor
      ref={editorRef}
      initialDoc={doc}
      rules={style.colorRules}
      onChange={setDoc}
      selectAllToken={isMobile ? selectAllToken : 0}
    />
  );
  const styleControls = (
    <>
      <StyleControls style={style} onChange={setStyle} />
      <ColorRulesPanel
        rules={style.colorRules}
        onChange={(colorRules) => setStyle((current) => ({ ...current, colorRules }))}
      />
    </>
  );
  const presets = (
    <PresetMenu
      doc={doc}
      style={style}
      activeId={activeId}
      name={name}
      onNameChange={setName}
      onLoad={loadPreset}
      onSaved={(id, savedName) => {
        setActiveId(id);
        setName(savedName);
      }}
      onActiveCleared={() => setActiveId(null)}
    />
  );

  if (isMobile) {
    return (
      <div className="relative h-svh">
        <BigTextDisplay doc={doc} style={style} onChange={changeDoc} onEditEnd={finishInlineEdit} />
        <Drawer showSwipeHandle>
          <DrawerTrigger
            render={
              <Button
                variant="secondary"
                size="icon-sm"
                aria-label={t("openControls")}
                className="fixed bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-1/2 z-30 -translate-x-[calc(100%+0.125rem)]"
              />
            }
          >
            <SlidersHorizontalIcon />
          </DrawerTrigger>
          <DrawerContent className="[--drawer-height:85svh]">
            <DrawerHeader className="sr-only">
              <DrawerTitle>{t("openControls")}</DrawerTitle>
            </DrawerHeader>
            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {styleControls}
            </div>
          </DrawerContent>
        </Drawer>
        <Drawer
          showSwipeHandle
          open={textOpen}
          onOpenChange={(open) => {
            setTextOpen(open);
            if (open) setSelectAllToken((token) => token + 1);
          }}
        >
          <DrawerTrigger
            render={
              <Button
                variant="secondary"
                size="icon-sm"
                aria-label={t("editText")}
                className="fixed bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-1/2 z-30 -translate-x-[calc(200%+0.375rem)]"
              />
            }
          >
            <PencilIcon />
          </DrawerTrigger>
          <DrawerContent className="[--drawer-height:50svh]">
            <DrawerHeader className="sr-only">
              <DrawerTitle>{t("editText")}</DrawerTitle>
            </DrawerHeader>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {editor}
            </div>
          </DrawerContent>
        </Drawer>
        <Drawer showSwipeHandle open={presetsOpen} onOpenChange={setPresetsOpen}>
          <DrawerTrigger
            render={
              <Button
                variant="secondary"
                size="icon-sm"
                aria-label={t("openPresets")}
                className="fixed bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-1/2 z-30 translate-x-[0.125rem]"
              />
            }
          >
            <BookmarkIcon />
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="sr-only">
              <DrawerTitle>{t("presetsTitle")}</DrawerTitle>
            </DrawerHeader>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {presets}
            </div>
          </DrawerContent>
        </Drawer>
        <Button
          nativeButton={false}
          variant="secondary"
          size="icon-sm"
          aria-label={t("openTalk")}
          className="fixed bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-1/2 z-30 translate-x-[calc(100%+0.375rem)]"
          render={<Link to="/talk" />}
        >
          <MessagesSquareIcon />
        </Button>
      </div>
    );
  }

  return (
    <div className="grid h-[calc(100svh-3.5rem)] grid-cols-[clamp(20rem,30vw,26rem)_minmax(0,1fr)]">
      <aside className="flex flex-col gap-6 overflow-y-auto border-r border-border p-4">
        {editor}
        {styleControls}
        {presets}
      </aside>
      <BigTextDisplay doc={doc} style={style} onChange={changeDoc} onEditEnd={finishInlineEdit} />
    </div>
  );
}
