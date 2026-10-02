/**
 * Returns a same-app relative path for post-login navigation,
 * or "/" if the value is missing or unsafe (open-redirect protection).
 */
import { PUBLIC_READ } from "../../../instant.perms";

function defaultRedirect(): string {
  return PUBLIC_READ ? "/" : "/files";
}

export function getSafeAuthRedirect(redirect: unknown, origin?: string): string {
  if (typeof redirect !== "string" || redirect.length === 0) {
    return defaultRedirect();
  }

  // Reject backslashes, control chars, and encoded separators before other checks.
  if (redirect.includes("\\") || /%2f|%5c|%00/i.test(redirect) || hasControlChars(redirect)) {
    return defaultRedirect();
  }

  if (!redirect.startsWith("/")) {
    return defaultRedirect();
  }
  // Protocol-relative or absolute URLs
  if (redirect.startsWith("//") || redirect.includes("://")) {
    return defaultRedirect();
  }
  // Avoid bouncing back to login
  if (redirect === "/login" || redirect.startsWith("/login?") || redirect.startsWith("/login#")) {
    return defaultRedirect();
  }

  const base =
    origin ?? (typeof window !== "undefined" ? window.location.origin : "https://app.local");
  try {
    const parsed = new URL(redirect, base);
    if (parsed.origin !== new URL(base).origin) {
      return defaultRedirect();
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return defaultRedirect();
  }
}

function hasControlChars(value: string): boolean {
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code < 32 || code === 127) {
      return true;
    }
  }
  return false;
}
