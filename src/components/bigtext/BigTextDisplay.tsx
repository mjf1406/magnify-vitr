import { MaximizeIcon, MinimizeIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useFitText } from "@/hooks/bigtext/useFitText";
import { useIsMobile } from "@/hooks/use-mobile";
import { docIsEmpty, FONT_STACKS, type PresetStyle, type RichDoc } from "@/lib/bigtext/types";

import { InlineTextEditor } from "./InlineTextEditor";

type BigTextDisplayProps = {
  doc: RichDoc;
  style: PresetStyle;
  onChange?: (doc: RichDoc) => void;
  onEditEnd?: () => void;
};

export function BigTextDisplay({ doc, style, onChange, onEditEnd }: BigTextDisplayProps) {
  const { t } = useTranslation("bigtext");
  const isMobile = useIsMobile();
  const frameRef = useRef<HTMLDivElement>(null);
  const fullscreenExitAtRef = useRef(0);
  const fontSizeRef = useRef(48);
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);
  const [isFull, setIsFull] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fit = useFitText(box, doc, style);
  if (fit && fit.fontSize > 0) fontSizeRef.current = fit.fontSize;
  const stack = FONT_STACKS[style.fontFamily];
  const justify =
    style.align === "left" ? "flex-start" : style.align === "right" ? "flex-end" : "center";

  useEffect(() => {
    const element = frameRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      setBox((current) => {
        if (current && current.width === rect.width && current.height === rect.height)
          return current;
        return { width: rect.width, height: rect.height };
      });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onChange = () => {
      setIsFull(document.fullscreenElement === frameRef.current);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggleFullscreen() {
    const element = frameRef.current;
    if (!element) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void element.requestFullscreen();
  }

  function finishEditing() {
    setIsEditing(false);
    onEditEnd?.();
  }

  function startEditing() {
    if (Date.now() - fullscreenExitAtRef.current < 500) return;
    if (document.fullscreenElement === frameRef.current) return;
    if (!onChange || !fit || fit.fontSize <= 0) return;
    setIsEditing(true);
  }

  return (
    <div
      ref={frameRef}
      className="relative h-full min-h-[50vh] overflow-hidden"
      style={{ backgroundColor: style.backgroundColor }}
      onClick={() => {
        if (document.fullscreenElement === frameRef.current) {
          fullscreenExitAtRef.current = Date.now();
          void document.exitFullscreen();
        }
      }}
    >
      {isMobile ? null : (
        <div className="absolute top-3 right-3 z-10">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            aria-label={isFull ? t("exitFullscreen") : t("fullscreen")}
            onClick={(event) => {
              event.stopPropagation();
              toggleFullscreen();
            }}
          >
            {isFull ? <MinimizeIcon /> : <MaximizeIcon />}
            {isFull ? t("exitFullscreen") : t("fullscreen")}
          </Button>
        </div>
      )}
      <div
        className={`flex h-full min-h-[50vh] w-full${onChange && !isEditing ? " cursor-text" : ""}`}
        style={{
          padding: style.padding,
          alignItems: "center",
          justifyContent: justify,
        }}
        title={onChange && !isEditing ? t("doubleClickToEdit") : undefined}
        onDoubleClick={(event) => {
          event.stopPropagation();
          if (isEditing) return;
          event.preventDefault();
          startEditing();
        }}
      >
        {isEditing && onChange ? (
          <div className="w-full min-w-0">
            <InlineTextEditor
              doc={doc}
              rules={style.colorRules}
              fontSize={fontSizeRef.current}
              fontFamily={stack.css}
              lineHeight={style.lineHeight}
              textAlign={style.align}
              color={style.textColor}
              onChange={onChange}
              onDone={finishEditing}
            />
          </div>
        ) : docIsEmpty(doc) ? (
          <p className="text-sm" style={{ color: style.textColor, opacity: 0.45 }}>
            {t("placeholder")}
          </p>
        ) : (
          <div style={{ textAlign: style.align }}>
            {fit?.lines.map((line, lineIndex) => (
              <div
                key={lineIndex}
                style={{
                  height: line.lineHeight,
                  lineHeight: `${line.lineHeight}px`,
                  whiteSpace: "pre",
                }}
              >
                {line.fragments.length === 0
                  ? "\u200b"
                  : line.fragments.map((fragment, fragmentIndex) => (
                      <span
                        key={fragmentIndex}
                        style={{
                          fontFamily: stack.css,
                          fontSize: fit.fontSize * fragment.scale,
                          fontWeight: fragment.bold ? 700 : 400,
                          fontStyle: fragment.italic ? "italic" : "normal",
                          textDecoration: fragment.underline ? "underline" : undefined,
                          color: fragment.color ?? style.textColor,
                        }}
                      >
                        {fragment.text}
                      </span>
                    ))}
              </div>
            ))}
          </div>
        )}
      </div>
      <span className="sr-only">{t("previewLabel")}</span>
    </div>
  );
}
