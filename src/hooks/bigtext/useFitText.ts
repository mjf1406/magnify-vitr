import { useEffect, useMemo, useState } from "react";

import { fitText, type FitResult } from "@/lib/bigtext/fit";
import { measureWithPretext } from "@/lib/bigtext/measure";
import { applyColorRules } from "@/lib/bigtext/tokenize";
import { FONT_STACKS, type PresetStyle, type RichDoc } from "@/lib/bigtext/types";

export function useFitText(
  box: { width: number; height: number } | null,
  doc: RichDoc,
  style: PresetStyle,
): FitResult | null {
  const [fontsReady, setFontsReady] = useState(false);
  const colored = useMemo(() => applyColorRules(doc, style.colorRules), [doc, style.colorRules]);
  const canvasFamily = FONT_STACKS[style.fontFamily].canvas;

  useEffect(() => {
    let cancelled = false;
    setFontsReady(false);
    const fonts = document.fonts;
    void fonts
      .load(`16px ${canvasFamily}`)
      .then(() => fonts.ready)
      .then(() => {
        if (!cancelled) setFontsReady(true);
      })
      .catch(() => {
        if (!cancelled) setFontsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [canvasFamily]);

  return useMemo(() => {
    if (!box || !fontsReady || box.width <= 0 || box.height <= 0) return null;
    return fitText({
      doc: colored,
      maxWidth: box.width,
      maxHeight: box.height,
      padding: style.padding,
      lineHeight: style.lineHeight,
      fontFamily: style.fontFamily,
      measure: measureWithPretext,
    });
  }, [box, colored, fontsReady, style.fontFamily, style.lineHeight, style.padding]);
}
