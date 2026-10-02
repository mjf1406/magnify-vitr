type VitePublicEnvKey =
  | "VITE_INSTANT_APP_ID"
  | "VITE_INSTANT_API_URI"
  | "VITE_INSTANT_WEBSOCKET_URI"
  | "VITE_INSTANT_GOOGLE_CLIENT_NAME";

type RuntimeEnv = Partial<Record<VitePublicEnvKey, string>>;

declare global {
  interface Window {
    __RUNTIME_ENV__?: RuntimeEnv;
    /** @deprecated Prefer `__RUNTIME_ENV__`. Kept so older containers still boot. */
    __SELF_HOST_ENV__?: RuntimeEnv;
  }
}

/**
 * Prefer container-injected `window.__RUNTIME_ENV__`, then Vite build-time env.
 */
export function readViteEnv(key: VitePublicEnvKey): string | undefined {
  const injected =
    typeof window !== "undefined"
      ? (window.__RUNTIME_ENV__?.[key] ?? window.__SELF_HOST_ENV__?.[key])
      : undefined;
  if (typeof injected === "string" && injected.length > 0) {
    return injected;
  }
  const baked = import.meta.env[key];
  return typeof baked === "string" && baked.length > 0 ? baked : undefined;
}
