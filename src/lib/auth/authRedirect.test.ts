import { describe, expect, test } from "vite-plus/test";

import { getSafeAuthRedirect } from "./authRedirect";

const ORIGIN = "https://app.example.com";

describe("getSafeAuthRedirect", () => {
  test("allows same-app relative paths", () => {
    expect(getSafeAuthRedirect("/files", ORIGIN)).toBe("/files");
    expect(getSafeAuthRedirect("/account?tab=1", ORIGIN)).toBe("/account?tab=1");
  });

  test("rejects empty and non-strings", () => {
    expect(getSafeAuthRedirect(undefined, ORIGIN)).toBe("/files");
    expect(getSafeAuthRedirect("", ORIGIN)).toBe("/files");
    expect(getSafeAuthRedirect(42, ORIGIN)).toBe("/files");
  });

  test("rejects protocol-relative and absolute URLs", () => {
    expect(getSafeAuthRedirect("//evil.com", ORIGIN)).toBe("/files");
    expect(getSafeAuthRedirect("https://evil.com", ORIGIN)).toBe("/files");
    expect(getSafeAuthRedirect("https:evil.com", ORIGIN)).toBe("/files");
  });

  test("rejects backslash and encoded separator bypasses", () => {
    expect(getSafeAuthRedirect("/\\evil.com", ORIGIN)).toBe("/files");
    expect(getSafeAuthRedirect("/%5Cevil.com", ORIGIN)).toBe("/files");
    expect(getSafeAuthRedirect("/%2f%2fevil.com", ORIGIN)).toBe("/files");
    expect(getSafeAuthRedirect("/%00/evil", ORIGIN)).toBe("/files");
  });

  test("rejects login bounce-backs", () => {
    expect(getSafeAuthRedirect("/login", ORIGIN)).toBe("/files");
    expect(getSafeAuthRedirect("/login?x=1", ORIGIN)).toBe("/files");
    expect(getSafeAuthRedirect("/login#hash", ORIGIN)).toBe("/files");
  });
});
