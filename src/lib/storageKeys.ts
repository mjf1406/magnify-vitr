import { APP_CONFIG } from "@/config/app";

/** Browser storage key scoped to the product slug (avoids clashes when multiple apps share an origin). */
export function appStorageKey(suffix: string): string {
  return `${APP_CONFIG.slug}-${suffix}`;
}

export const STORAGE_KEYS = {
  language: appStorageKey("language"),
  theme: appStorageKey("ui-theme"),
  /** sessionStorage: hide PWA reload banner until the tab session ends. */
  pwaUpdateLater: appStorageKey("pwa-update-later"),
} as const;
