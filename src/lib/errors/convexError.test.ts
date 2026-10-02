import { describe, expect, test } from "vite-plus/test";

import { codeFromError, messageFromError } from "./convexError";

describe("messageFromError", () => {
  test("reads Error message", () => {
    expect(messageFromError(new Error("Already in"), "fallback")).toBe("Already in");
  });

  test("falls back when message empty", () => {
    expect(messageFromError(new Error("   "), "fallback")).toBe("fallback");
  });

  test("uses rate-limited copy", () => {
    expect(
      messageFromError({ code: "RATE_LIMITED", message: "slow down" }, "fallback", "Too many"),
    ).toBe("Too many");
  });
});

describe("codeFromError", () => {
  test("reads code from object", () => {
    expect(codeFromError({ code: "ALREADY_MEMBER", message: "x" })).toBe("ALREADY_MEMBER");
  });

  test("returns undefined without code", () => {
    expect(codeFromError(new Error("nope"))).toBeUndefined();
  });
});
