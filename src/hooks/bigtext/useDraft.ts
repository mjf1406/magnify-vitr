import { useEffect, useRef } from "react";

import { saveDraft } from "@/lib/bigtext/draft";
import type { PresetStyle, RichDoc } from "@/lib/bigtext/types";

export function useDraft(doc: RichDoc, style: PresetStyle) {
  const skipFirst = useRef(true);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    const handle = window.setTimeout(() => {
      saveDraft({ doc, style });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [doc, style]);
}
