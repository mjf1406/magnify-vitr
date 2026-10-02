import { describe, expect, test } from "vite-plus/test";

import { providerDisplayName } from "@/lib/account/accountHelpers";

describe("providerDisplayName", () => {
  test("formats known and unknown providers", () => {
    expect(providerDisplayName("google")).toBe("Google");
    expect(providerDisplayName("github")).toBe("Github");
  });
});
