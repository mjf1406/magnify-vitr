import { measureNaturalWidth, prepareWithSegments } from "@chenglou/pretext";

import type { MeasureWidth } from "./fit";

const cache = new Map<string, number>();

/** Measure one unwrapped string with pretext. Results are cached per font and text. */
export const measureWithPretext: MeasureWidth = (text, font) => {
  if (text.length === 0) return 0;
  const key = `${font}\0${text}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;
  const prepared = prepareWithSegments(text, font, { whiteSpace: "pre-wrap" });
  const width = measureNaturalWidth(prepared);
  cache.set(key, width);
  return width;
};
