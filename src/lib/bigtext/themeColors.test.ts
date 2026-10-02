import { describe, expect, test } from "vite-plus/test";

import { applyThemeColors, defaultStyle, themePalettes } from "./types";

describe("applyThemeColors", () => {
  test("switches the default dark canvas to the light theme", () => {
    const next = applyThemeColors(defaultStyle(), "light");
    expect(next.backgroundColor).toBe(themePalettes.light.backgroundColor);
    expect(next.textColor).toBe(themePalettes.light.textColor);
  });

  test("leaves a dark canvas unchanged in the dark theme", () => {
    const style = defaultStyle();
    expect(applyThemeColors(style, "dark")).toBe(style);
  });

  test("restores the dark canvas from the light pair", () => {
    const light = applyThemeColors(defaultStyle(), "light");
    const next = applyThemeColors(light, "dark");
    expect(next.backgroundColor).toBe("#111111");
    expect(next.textColor).toBe("#f8fafc");
  });

  test("keeps a custom background when the theme changes", () => {
    const style = { ...defaultStyle(), backgroundColor: "#123456" };
    expect(applyThemeColors(style, "light")).toBe(style);
  });
});
