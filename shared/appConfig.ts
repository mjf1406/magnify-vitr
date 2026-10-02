/**
 * TEMPLATE: Single brand config — change these when cloning (`bun run post-clone`).
 * Brand source: `public/brand/logo/magnitext-logo.webp`.
 * Derived icons: `bun run brand:icons` → `public/vitr/`, `public/pwa/`, favicon.
 * `name` is never translated — i18n uses it via defaultVariables.appName.
 */
export const APP_CONFIG = {
  name: "Magnitext",
  /** Storage keys (`${slug}-…` via src/lib/storageKeys.ts) and package-name check. */
  slug: "magnify",
  /** Appended after name in the document title (`Name | suffix`). */
  titleSuffix: "App",
  /** Canonical app origin. */
  appUrl: "https://app.example.com",
  marketingUrl: "https://www.example.com",
  privacyUrl: "https://www.example.com/privacy-policy",
  termsUrl: "https://www.example.com/terms-and-conditions",
  cookieUrl: "https://www.example.com/cookie-policy",
  changeLog: "https://github.com/mjf1406/vitr",
  roadMap: "https://github.com/mjf1406/vitr",
  github: "https://github.com/mjf1406/vitr",
  /** Browser chrome — hex (meta theme-color is unreliable with oklch). */
  themeColors: {
    light: "#ffffff",
    dark: "#0a0a0a",
  },
  /** Keep aligned with page background (`oklch(0.145 0 0)` in dark mode). */
  backgroundColors: {
    light: "#ffffff",
    dark: "#0a0a0a",
  },
  /**
   * Upload size limits (client-side validation).
   */
  uploads: {
    maxSizeBytes: {
      images: 2 * 1024 * 1024,
      documents: 500 * 1024,
      audio: 5 * 1024 * 1024,
    },
  },
} as const;
