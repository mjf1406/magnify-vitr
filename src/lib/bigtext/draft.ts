import { STORAGE_KEYS } from "@/lib/storageKeys";

import { draftSchema, type BigTextDraft } from "./types";

export function loadDraft(): BigTextDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.bigtextDraft);
    if (!raw) return null;
    const parsed = draftSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function saveDraft(draft: BigTextDraft): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.bigtextDraft, JSON.stringify(draft));
  } catch {
    // A full or blocked store should not stop typing.
  }
}
