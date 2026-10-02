/**
 * Build favicon, in-app logos, and PWA icons from the source mark.
 * Source: public/brand/logo/magnitext-logo.webp (transparent WebP).
 *
 * Run: bun run brand:icons
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(ROOT, "public/brand/logo/magnitext-logo.webp");
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };

/**
 * Maskable / monochrome safe zone is a centered circle with diameter 80%
 * of the icon. A square mark fits inside that circle at about 56% of the canvas.
 */
const MASKABLE_MARK_RATIO = 0.56;
/** Home-screen and Apple icons: comfortable padding, OS may round the corners. */
const HOME_MARK_RATIO = 0.76;
/** Browser tabs and in-app marks: fill the frame. */
const TIGHT_MARK_RATIO = 0.88;

async function trimmedMark(size) {
  return sharp(SOURCE)
    .trim()
    .resize(size, size, {
      fit: "contain",
      background: CLEAR,
      kernel: "lanczos3",
    })
    .png()
    .toBuffer();
}

async function squareIcon({ size, markRatio, background }) {
  const markSize = Math.max(1, Math.round(size * markRatio));
  const mark = await trimmedMark(markSize);
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .composite([{ input: mark, gravity: "centre" }])
    .png()
    .toBuffer();
}

async function monochromeIcon(size) {
  const png = await squareIcon({
    size,
    markRatio: MASKABLE_MARK_RATIO,
    background: CLEAR,
  });
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixels = Buffer.from(data);
  for (let i = 0; i < pixels.length; i += info.channels) {
    const alpha = pixels[i + 3];
    pixels[i] = 255;
    pixels[i + 1] = 255;
    pixels[i + 2] = 255;
    pixels[i + 3] = alpha;
  }
  return sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .png()
    .toBuffer();
}

function buildIco(images) {
  const count = images.length;
  const headerSize = 6 + count * 16;
  let offset = headerSize;
  const entries = images.map((image) => {
    const entry = { ...image, offset };
    offset += image.png.length;
    return entry;
  });
  const buf = Buffer.alloc(offset);
  buf.writeUInt16LE(0, 0);
  buf.writeUInt16LE(1, 2);
  buf.writeUInt16LE(count, 4);
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const base = 6 + i * 16;
    const dimension = entry.size >= 256 ? 0 : entry.size;
    buf.writeUInt8(dimension, base);
    buf.writeUInt8(dimension, base + 1);
    buf.writeUInt8(0, base + 2);
    buf.writeUInt8(0, base + 3);
    buf.writeUInt16LE(1, base + 4);
    buf.writeUInt16LE(32, base + 6);
    buf.writeUInt32LE(entry.png.length, base + 8);
    buf.writeUInt32LE(entry.offset, base + 12);
    entry.png.copy(buf, entry.offset);
  }
  return buf;
}

async function writePng(relativePath, png) {
  const dest = path.join(ROOT, relativePath);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, png);
  console.log(`  ${relativePath}`);
}

async function writeWebp(relativePath, png) {
  const dest = path.join(ROOT, relativePath);
  await mkdir(path.dirname(dest), { recursive: true });
  await sharp(png).webp({ lossless: true, effort: 6 }).toFile(dest);
  console.log(`  ${relativePath}`);
}

const favicon16 = await squareIcon({ size: 16, markRatio: TIGHT_MARK_RATIO, background: CLEAR });
const favicon32 = await squareIcon({ size: 32, markRatio: TIGHT_MARK_RATIO, background: CLEAR });
const favicon48 = await squareIcon({ size: 48, markRatio: TIGHT_MARK_RATIO, background: CLEAR });

console.log("Writing brand icons from public/brand/logo/magnitext-logo.webp");
await writePng("public/favicon-16x16.png", favicon16);
await writePng("public/favicon-32x32.png", favicon32);
await writePng("public/favicon-48x48.png", favicon48);
await writeFile(
  path.join(ROOT, "public/favicon.ico"),
  buildIco([
    { size: 16, png: favicon16 },
    { size: 32, png: favicon32 },
    { size: 48, png: favicon48 },
  ]),
);
console.log("  public/favicon.ico");

await writeWebp(
  "public/vitr/logo-small.webp",
  await squareIcon({ size: 192, markRatio: TIGHT_MARK_RATIO, background: CLEAR }),
);
await writeWebp(
  "public/vitr/logo-big.webp",
  await squareIcon({ size: 512, markRatio: TIGHT_MARK_RATIO, background: CLEAR }),
);

await writePng(
  "public/pwa/apple-touch-icon.png",
  await squareIcon({ size: 180, markRatio: HOME_MARK_RATIO, background: WHITE }),
);
await writePng(
  "public/pwa/icon-192.png",
  await squareIcon({ size: 192, markRatio: HOME_MARK_RATIO, background: WHITE }),
);
await writePng(
  "public/pwa/icon-512.png",
  await squareIcon({ size: 512, markRatio: HOME_MARK_RATIO, background: WHITE }),
);
await writePng(
  "public/pwa/icon-192-maskable.png",
  await squareIcon({ size: 192, markRatio: MASKABLE_MARK_RATIO, background: WHITE }),
);
await writePng(
  "public/pwa/icon-512-maskable.png",
  await squareIcon({ size: 512, markRatio: MASKABLE_MARK_RATIO, background: WHITE }),
);
await writePng("public/pwa/icon-512-monochrome.png", await monochromeIcon(512));
await writePng(
  "public/pwa/mstile-150x150.png",
  await squareIcon({ size: 150, markRatio: HOME_MARK_RATIO, background: WHITE }),
);
