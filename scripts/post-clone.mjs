#!/usr/bin/env bun
/**
 * Post-clone setup for the single-user Instant PWA template.
 *
 * Prompts for brand identity, Instant connection details, and access mode.
 * An existing Instant app ID is enough to initialize (paste it when asked).
 * Writes a gitignored `.env.local` (no admin token) and sets `PUBLIC_READ`
 * in `instant.perms.ts`. Does not push schema or permissions.
 *
 * Usage:
 *   bun run post-clone
 *   bun scripts/post-clone.mjs --dry-run
 *   bun scripts/post-clone.mjs --name MyApp --slug my-app --github https://github.com/org/repo --app-id <id> --no-install
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const CHECKLIST_PATH = path.join(ROOT, "CLONE_CHECKLIST.md");
const APP_CONFIG_PATH = path.join(ROOT, "shared", "appConfig.ts");
const PACKAGE_JSON_PATH = path.join(ROOT, "package.json");
const INDEX_HTML_PATH = path.join(ROOT, "index.html");
const DOCKER_COMPOSE_PATH = path.join(ROOT, "docker-compose.yml");
const EXAMPLE_ENV_PATH = path.join(ROOT, "example.env");
const SELF_HOSTING_PATH = path.join(ROOT, "docs", "SELF_HOSTING.md");
const ENV_EXAMPLE_PATH = path.join(ROOT, ".env.example");
const ENV_LOCAL_PATH = path.join(ROOT, ".env.local");
const PERMS_PATH = path.join(ROOT, "instant.perms.ts");
const I18N_DIR = path.join(ROOT, "src", "i18n", "resources");

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const TEMPLATE_SLUGS = new Set(["vitr", "vctr", "classclarus"]);
const ACCESS_MODES = new Set(["private", "public-read"]);

/**
 * @param {string[]} argv
 */
function parseArgs(argv) {
  /** @type {Record<string, string | boolean>} */
  const out = { dryRun: false, yes: false, install: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") out.dryRun = true;
    else if (arg === "--yes" || arg === "-y") out.yes = true;
    else if (arg === "--no-install") out.install = false;
    else if (arg === "--install") out.install = true;
    else if (arg.startsWith("--") && argv[i + 1] && !argv[i + 1].startsWith("--")) {
      out[arg.slice(2)] = argv[++i];
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const dryRun = Boolean(args.dryRun);
const nonInteractive = typeof args.name === "string" && typeof args.github === "string";

/** @type {Array<{ path: string, note: string }>} */
const plannedWrites = [];

/**
 * @param {string} question
 * @param {string} [defaultValue]
 */
async function prompt(question, defaultValue = "") {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const suffix = defaultValue ? ` [${defaultValue}]` : "";
  const answer = await new Promise((resolve) => {
    rl.question(`${question}${suffix}: `, resolve);
  });
  rl.close();
  const trimmed = answer.trim();
  return trimmed || defaultValue;
}

/**
 * @param {string} question
 * @param {boolean} defaultYes
 */
async function promptYesNo(question, defaultYes = true) {
  const hint = defaultYes ? "Y/n" : "y/N";
  const answer = (await prompt(`${question} (${hint})`, "")).toLowerCase();
  if (!answer) return defaultYes;
  return answer === "y" || answer === "yes";
}

/**
 * @param {string} name
 */
function slugify(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

const APP_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Accept a pasted Instant app ID (UUID), including quoted or whitespace-wrapped values.
 * @param {string} value
 */
function normalizeAppId(value) {
  const trimmed = value.trim().replace(/^['"]|['"]$/g, "");
  return APP_ID_RE.test(trimmed) ? trimmed : "";
}

/**
 * @param {string} src
 * @returns {Record<string, string>}
 */
function parseEnvFile(src) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const line of src.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

/**
 * @returns {Promise<Record<string, string>>}
 */
async function readExistingEnvLocal() {
  if (!existsSync(ENV_LOCAL_PATH)) return {};
  return parseEnvFile(await readFile(ENV_LOCAL_PATH, "utf8"));
}

/**
 * @param {string} filePath
 * @param {string} contents
 * @param {string} note
 */
async function writeText(filePath, contents, note) {
  plannedWrites.push({ path: path.relative(ROOT, filePath), note });
  if (dryRun) return;
  await writeFile(filePath, contents, "utf8");
}

/**
 * @param {string} filePath
 * @param {(src: string) => string}
 * @param {string} note
 */
async function transformFile(filePath, transform, note) {
  const before = await readFile(filePath, "utf8");
  const after = transform(before);
  if (after === before) {
    console.warn(`  (no change) ${path.relative(ROOT, filePath)}`);
    return false;
  }
  await writeText(filePath, after, note);
  return true;
}

/**
 * @param {string} src
 * @param {string} key
 * @param {string} value
 */
function replaceStringProp(src, key, value) {
  const re = new RegExp(`(${key}:\\s*)"[^"]*"`, "m");
  if (!re.test(src)) {
    throw new Error(`Could not find string property "${key}" in appConfig`);
  }
  return src.replace(re, `$1${JSON.stringify(value)}`);
}

/**
 * @param {object} identity
 * @param {string} identity.name
 * @param {string} identity.slug
 * @param {string} identity.titleSuffix
 * @param {string} identity.appUrl
 * @param {string} identity.marketingUrl
 * @param {string} identity.privacyUrl
 * @param {string} identity.termsUrl
 * @param {string} identity.cookieUrl
 * @param {string} identity.changeLog
 * @param {string} identity.roadMap
 * @param {string} identity.github
 */
async function rewriteAppConfig(identity) {
  await transformFile(
    APP_CONFIG_PATH,
    (src) => {
      let next = src;
      const stringFields = [
        ["name", identity.name],
        ["slug", identity.slug],
        ["titleSuffix", identity.titleSuffix],
        ["appUrl", identity.appUrl],
        ["marketingUrl", identity.marketingUrl],
        ["privacyUrl", identity.privacyUrl],
        ["termsUrl", identity.termsUrl],
        ["cookieUrl", identity.cookieUrl],
        ["changeLog", identity.changeLog],
        ["roadMap", identity.roadMap],
        ["github", identity.github],
      ];
      for (const [key, value] of stringFields) {
        next = replaceStringProp(next, key, value);
      }
      return next;
    },
    "APP_CONFIG identity fields",
  );
}

/**
 * @param {object} identity
 * @param {string} identity.name
 * @param {string} identity.github
 * @param {string} identity.slug
 */
async function rewritePackageJson(identity) {
  const raw = await readFile(PACKAGE_JSON_PATH, "utf8");
  const pkg = JSON.parse(raw);
  pkg.name = identity.slug;
  pkg.description = `${identity.name} — single-user InstantDB PWA`;
  pkg.author = identity.name;
  pkg.repository = {
    type: "git",
    url: identity.github.endsWith(".git") ? identity.github : `${identity.github}.git`,
  };
  const next = `${JSON.stringify(pkg, null, 2)}\n`;
  await writeText(PACKAGE_JSON_PATH, next, "package.json name/description/author/repository");
}

/**
 * @param {string} name
 */
async function rewriteIndexHtml(name) {
  await transformFile(
    INDEX_HTML_PATH,
    (src) => src.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(name)}</title>`),
    "index.html title",
  );
}

/**
 * @param {string} text
 */
function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * @param {string} slug
 */
async function rewriteDockerCompose(slug) {
  await transformFile(
    DOCKER_COMPOSE_PATH,
    (src) => src.replace(/^name:\s*.+$/m, `name: ${slug}`),
    "docker-compose.yml name",
  );
}

/**
 * @param {string} githubUrl
 */
async function rewriteSelfHostingDocs(githubUrl) {
  const repoHttps = githubUrl.replace(/\.git$/, "");
  await transformFile(
    SELF_HOSTING_PATH,
    (src) => src.replaceAll("https://github.com/mjf1406/vitr", repoHttps),
    "docs/SELF_HOSTING.md repo URL",
  );
}

/**
 * @param {string} tagline
 */
async function rewriteFooterTaglines(tagline) {
  const files = (await readdir(I18N_DIR)).filter((f) => f.endsWith(".ts"));
  for (const file of files) {
    const filePath = path.join(I18N_DIR, file);
    await transformFile(
      filePath,
      (src) => {
        if (!/footerTagline:\s*"/.test(src)) return src;
        return src.replace(
          /footerTagline:\s*"(?:\\.|[^"\\])*"/,
          `footerTagline: ${JSON.stringify(tagline)}`,
        );
      },
      `${file} footerTagline`,
    );
  }
}

/**
 * @param {boolean} publicRead
 */
async function rewritePublicRead(publicRead) {
  await transformFile(
    PERMS_PATH,
    (src) => {
      if (!/export const PUBLIC_READ = (true|false);/.test(src)) {
        throw new Error("Could not find PUBLIC_READ in instant.perms.ts");
      }
      return src.replace(
        /export const PUBLIC_READ = (true|false);/,
        `export const PUBLIC_READ = ${publicRead};`,
      );
    },
    `instant.perms.ts PUBLIC_READ=${publicRead}`,
  );
}

function envExampleContents() {
  return `# Vite / local client env (copied ideas only — do not commit real secrets)

# Instant app ID is enough to initialize. Paste an existing app ID from the dashboard.
INSTANT_APP_ID=
VITE_INSTANT_APP_ID=

# Optional. Leave blank for Instant Cloud (api.instantdb.com).
# VITE_INSTANT_API_URI=https://instant.example.com
# VITE_INSTANT_WEBSOCKET_URI=
VITE_INSTANT_GOOGLE_CLIENT_NAME=google-web

# Instant CLI (only needed for a self-hosted Instant API/dashboard)
# INSTANT_CLI_API_URI=https://instant.example.com
# INSTANT_CLI_DASH_URI=https://instant-dash.example.com

# See CLONE_CHECKLIST.md for the full setup order.
`;
}

async function writeEnvExample() {
  await writeText(ENV_EXAMPLE_PATH, envExampleContents(), ".env.example");
}

/**
 * @param {object} instant
 * @param {string} instant.appId
 * @param {string} [instant.apiUri]
 * @param {string} [instant.websocketUri]
 * @param {string} instant.googleClientName
 * @param {string} [instant.cliApiUri]
 * @param {string} [instant.cliDashUri]
 */
async function writeEnvLocal(instant) {
  const lines = [
    "# Generated by bun run post-clone. Do not commit.",
    `# Instant CLI reads INSTANT_APP_ID or VITE_INSTANT_APP_ID.`,
    `INSTANT_APP_ID=${instant.appId}`,
    `VITE_INSTANT_APP_ID=${instant.appId}`,
  ];
  if (instant.apiUri) {
    lines.push(`VITE_INSTANT_API_URI=${instant.apiUri}`);
  }
  if (instant.websocketUri) {
    lines.push(`VITE_INSTANT_WEBSOCKET_URI=${instant.websocketUri}`);
  }
  lines.push(`VITE_INSTANT_GOOGLE_CLIENT_NAME=${instant.googleClientName}`);
  if (instant.cliApiUri) {
    lines.push(`INSTANT_CLI_API_URI=${instant.cliApiUri}`);
  }
  if (instant.cliDashUri) {
    lines.push(`INSTANT_CLI_DASH_URI=${instant.cliDashUri}`);
  }
  lines.push("");
  await writeText(ENV_LOCAL_PATH, `${lines.join("\n")}`, ".env.local Instant connection");
}

/**
 * @param {string} src
 * @param {string[]} ids
 * @returns {{ src: string, marked: string[] }}
 */
function applyChecklistMarks(src, ids) {
  /** @type {string[]} */
  const marked = [];
  let next = src;
  for (const id of ids) {
    const unchecked = new RegExp(`(<!--\\s*clone:${id}\\s*-->\\r?\\n)(\\s*-\\s+)\\[ \\]`);
    const checked = new RegExp(`<!--\\s*clone:${id}\\s*-->\\r?\\n\\s*-\\s+\\[[xX]\\]`);
    if (unchecked.test(next)) {
      next = next.replace(unchecked, "$1$2[x]");
      marked.push(id);
    } else if (checked.test(next)) {
      marked.push(id);
    } else {
      console.warn(`  checklist id/task not found: ${id}`);
    }
  }
  return { src: next, marked };
}

/**
 * @param {string} src
 * @param {number} limit
 */
function listNextUncheckedFrom(src, limit = 5) {
  const lines = src.split(/\r?\n/);
  /** @type {Array<{ id: string | null, text: string }>} */
  const unchecked = [];
  let pendingId = null;
  for (const line of lines) {
    const idMatch = line.match(/<!--\s*clone:([a-z0-9-]+)\s*-->/);
    if (idMatch) {
      pendingId = idMatch[1];
      continue;
    }
    const task = line.match(/^\s*-\s+\[ \]\s+(.+)$/);
    if (task) {
      unchecked.push({ id: pendingId, text: task[1] });
      pendingId = null;
      if (unchecked.length >= limit) break;
    } else if (line.trim() !== "") {
      pendingId = null;
    }
  }
  return unchecked;
}

/**
 * @param {string[]} ids
 */
async function markCloneChecklistDone(ids) {
  if (!existsSync(CHECKLIST_PATH)) {
    console.warn("CLONE_CHECKLIST.md missing — skip auto-check.");
    return { marked: [], src: "" };
  }
  const before = await readFile(CHECKLIST_PATH, "utf8");
  const { src, marked } = applyChecklistMarks(before, ids);
  if (src !== before) {
    await writeText(CHECKLIST_PATH, src, `checklist: ${marked.join(", ") || "(none)"}`);
  }
  return { marked, src };
}

/**
 * @param {string} cmd
 * @param {string[]} cmdArgs
 */
function runCommand(cmd, cmdArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, cmdArgs, {
      cwd: ROOT,
      stdio: "inherit",
      shell: process.platform === "win32",
      windowsHide: true,
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${cmdArgs.join(" ")} exited with ${code}`));
    });
  });
}

/**
 * @param {string} name
 * @param {string} slug
 * @param {string} github
 * @param {Partial<{ titleSuffix: string, appUrl: string, marketingUrl: string, privacyUrl: string, termsUrl: string, cookieUrl: string, changeLog: string, roadMap: string, footerTagline: string }>} [overrides]
 */
function buildIdentity(name, slug, github, overrides = {}) {
  const marketingUrl = overrides.marketingUrl ?? `https://www.${slug}.com`;
  const changeLog = overrides.changeLog ?? `${github.replace(/\.git$/, "")}/releases`;
  return {
    name,
    slug,
    titleSuffix: overrides.titleSuffix ?? "App",
    appUrl: overrides.appUrl ?? `https://app.${slug}.com`,
    marketingUrl,
    privacyUrl: overrides.privacyUrl ?? `${marketingUrl}/privacy-policy`,
    termsUrl: overrides.termsUrl ?? `${marketingUrl}/terms-and-conditions`,
    cookieUrl: overrides.cookieUrl ?? `${marketingUrl}/cookie-policy`,
    changeLog,
    roadMap: overrides.roadMap ?? `${github.replace(/\.git$/, "")}#readme`,
    github: github.replace(/\.git$/, ""),
    footerTagline: overrides.footerTagline ?? `${name} — a single-user Instant PWA.`,
  };
}

/**
 * @param {string} value
 */
function normalizeAccessMode(value) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "public" || normalized === "publicread") return "public-read";
  return normalized;
}

async function collectIdentity() {
  console.log("");
  console.log("Post-clone identity setup");
  console.log(dryRun ? "(dry run — no files will be written)\n" : "");

  if (nonInteractive) {
    const name = String(args.name);
    const slug = typeof args.slug === "string" ? args.slug : slugify(name);
    if (!SLUG_RE.test(slug)) {
      console.error(`Invalid slug "${slug}". Use lowercase letters, numbers, and hyphens.`);
      process.exit(1);
    }
    if (TEMPLATE_SLUGS.has(slug) && !args.yes) {
      console.error(`Slug "${slug}" matches the template. Pass --yes or choose a different slug.`);
      process.exit(1);
    }
    return buildIdentity(name, slug, String(args.github), {
      titleSuffix: typeof args["title-suffix"] === "string" ? args["title-suffix"] : undefined,
      appUrl: typeof args["app-url"] === "string" ? args["app-url"] : undefined,
      marketingUrl: typeof args["marketing-url"] === "string" ? args["marketing-url"] : undefined,
      footerTagline: typeof args.tagline === "string" ? args.tagline : undefined,
    });
  }

  const name = await prompt("Display name (required)");
  if (!name) {
    console.error("Display name is required.");
    process.exit(1);
  }

  const slug = await prompt("Slug (kebab-case)", slugify(name));
  if (!SLUG_RE.test(slug)) {
    console.error(`Invalid slug "${slug}". Use lowercase letters, numbers, and hyphens.`);
    process.exit(1);
  }

  if (TEMPLATE_SLUGS.has(slug)) {
    const keep = await promptYesNo(
      `Slug "${slug}" matches the template. Continue and keep this identity?`,
      false,
    );
    if (!keep) {
      console.error("Choose a different slug for a fresh product.");
      process.exit(1);
    }
  }

  const github = await prompt("GitHub repo URL (https://github.com/org/repo)");
  if (!github) {
    console.error("GitHub repo URL is required.");
    process.exit(1);
  }

  const titleSuffix = await prompt("Document title suffix", "App");
  const appUrl = await prompt("App URL (canonical SPA origin)", `https://app.${slug}.com`);
  const marketingUrl = await prompt("Marketing URL", `https://www.${slug}.com`);
  const privacyUrl = await prompt("Privacy policy URL", `${marketingUrl}/privacy-policy`);
  const termsUrl = await prompt("Terms URL", `${marketingUrl}/terms-and-conditions`);
  const cookieUrl = await prompt("Cookie policy URL", `${marketingUrl}/cookie-policy`);
  const changeLog = await prompt("Changelog URL", `${github.replace(/\.git$/, "")}/releases`);
  const roadMap = await prompt("Roadmap URL", `${github.replace(/\.git$/, "")}#readme`);
  const footerTagline = await prompt(
    "Footer tagline (all locales)",
    `${name} — a single-user Instant PWA.`,
  );

  return buildIdentity(name, slug, github, {
    titleSuffix,
    appUrl,
    marketingUrl,
    privacyUrl,
    termsUrl,
    cookieUrl,
    changeLog,
    roadMap,
    footerTagline,
  });
}

/**
 * @param {Record<string, string>} existing
 */
async function collectInstantConfig(existing) {
  const existingAppId = existing.VITE_INSTANT_APP_ID ?? existing.INSTANT_APP_ID ?? "";
  const existingApi = existing.VITE_INSTANT_API_URI ?? "";
  const existingWs = existing.VITE_INSTANT_WEBSOCKET_URI ?? "";
  const existingGoogle = existing.VITE_INSTANT_GOOGLE_CLIENT_NAME ?? "google-web";
  const existingCliApi = existing.INSTANT_CLI_API_URI ?? existingApi;
  const existingCliDash = existing.INSTANT_CLI_DASH_URI ?? "";

  if (nonInteractive) {
    const rawAppId = typeof args["app-id"] === "string" ? args["app-id"] : existingAppId;
    const appId = normalizeAppId(rawAppId);
    if (!appId) {
      console.error("Paste an existing Instant app ID with --app-id (or keep one in .env.local).");
      process.exit(1);
    }
    const apiUri = typeof args["instant-api"] === "string" ? args["instant-api"] : existingApi;
    return {
      appId,
      apiUri,
      websocketUri: typeof args["instant-ws"] === "string" ? args["instant-ws"] : existingWs,
      googleClientName:
        typeof args["google-client"] === "string" ? args["google-client"] : existingGoogle,
      cliApiUri: typeof args["cli-api"] === "string" ? args["cli-api"] : existingCliApi || apiUri,
      cliDashUri: typeof args["cli-dash"] === "string" ? args["cli-dash"] : existingCliDash,
    };
  }

  console.log("");
  console.log("Instant: paste an existing app ID from the dashboard.");
  console.log("That is enough to initialize. API URLs are only needed for self-hosted Instant.");
  if (existingAppId) {
    console.log("Existing `.env.local` values will be kept if you press Enter.");
  }

  const appId = normalizeAppId(await prompt("Instant app ID (paste existing UUID)", existingAppId));
  if (!appId) {
    console.error(
      "A valid Instant app ID is required (example: 4f1e575c-6c00-44dd-bc69-004e89b9d788).",
    );
    process.exit(1);
  }

  const apiUri = await prompt("Instant API URL (optional; blank = Instant Cloud)", existingApi);
  const websocketUri = apiUri
    ? await prompt("Instant WebSocket URL (optional; leave blank to derive)", existingWs)
    : existingWs;
  const googleClientName = await prompt("Google OAuth client name", existingGoogle);
  const cliApiUri = apiUri
    ? await prompt("Instant CLI API URL", existingCliApi || apiUri)
    : existingCliApi;
  const cliDashUri = apiUri
    ? await prompt("Instant CLI dashboard URL (optional)", existingCliDash)
    : existingCliDash;

  return {
    appId,
    apiUri,
    websocketUri,
    googleClientName,
    cliApiUri,
    cliDashUri,
  };
}

/**
 * @param {string} currentFlag
 */
async function collectAccessMode(currentFlag) {
  const current = currentFlag === "true" ? "public-read" : "private";
  if (nonInteractive) {
    const raw = typeof args["access-mode"] === "string" ? args["access-mode"] : current;
    const mode = normalizeAccessMode(raw);
    if (!ACCESS_MODES.has(mode)) {
      console.error(`Invalid --access-mode "${raw}". Use private or public-read.`);
      process.exit(1);
    }
    return mode;
  }
  const answer = await prompt("Access mode (private / public-read)", current);
  const mode = normalizeAccessMode(answer);
  if (!ACCESS_MODES.has(mode)) {
    console.error(`Invalid access mode "${answer}". Use private or public-read.`);
    process.exit(1);
  }
  return mode;
}

async function readCurrentPublicRead() {
  if (!existsSync(PERMS_PATH)) return "false";
  const src = await readFile(PERMS_PATH, "utf8");
  const match = src.match(/export const PUBLIC_READ = (true|false);/);
  return match?.[1] ?? "false";
}

async function main() {
  const existingEnv = await readExistingEnvLocal();
  if (Object.keys(existingEnv).length > 0) {
    console.log("");
    console.log("Found `.env.local`. Existing Instant values are used as defaults.");
    console.log("This script never writes an Instant admin token.");
  }

  const identity = await collectIdentity();
  const instant = await collectInstantConfig(existingEnv);
  const accessMode = await collectAccessMode(await readCurrentPublicRead());
  const publicRead = accessMode === "public-read";

  console.log("\nApplying identity and Instant config…");
  console.warn(
    "This script does not push schema or permissions. Pushing the reduced schema to an app that still has classroom data is destructive.",
  );

  await rewriteAppConfig(identity);
  await rewritePackageJson(identity);
  await rewriteIndexHtml(identity.name);
  await rewriteDockerCompose(identity.slug);
  await rewriteSelfHostingDocs(identity.github);
  await rewriteFooterTaglines(identity.footerTagline);
  await rewritePublicRead(publicRead);
  await writeEnvExample();
  await writeEnvLocal(instant);
  await writeText(
    EXAMPLE_ENV_PATH,
    exampleEnvContents(identity.slug),
    "example.env Portainer vars",
  );

  /** @type {string[]} */
  const doneIds = [
    "identity-package",
    "identity-app-config",
    "identity-title",
    "identity-footer-tagline",
    "identity-self-host-docs",
    "identity-compose",
    "env-example",
    "instant-env-local",
    "access-mode",
  ];

  const runInstall =
    args.install === true
      ? true
      : args.install === false
        ? false
        : nonInteractive
          ? false
          : await promptYesNo("Run `vp install` now?", true);
  if (runInstall) {
    if (dryRun) {
      console.log("[dry-run] would run: vp install");
      doneIds.push("install-deps");
    } else {
      try {
        await runCommand("vp", ["install"]);
        doneIds.push("install-deps");
      } catch (err) {
        console.warn(`vp install failed (${err instanceof Error ? err.message : err}).`);
        console.warn(
          "You can run `vp install` or `bun install` manually, then check off install-deps.",
        );
      }
    }
  }

  const { marked, src: checklistSrc } = await markCloneChecklistDone(doneIds);

  if (dryRun) {
    console.log("\nDry run — planned writes:");
    for (const w of plannedWrites) {
      console.log(`  - ${w.path}: ${w.note}`);
    }
  }

  console.log("\n────────────────────────────────────────");
  console.log(`Checklist: ${path.relative(ROOT, CHECKLIST_PATH)}`);
  if (marked.length) {
    console.log(`Checked off: ${marked.join(", ")}`);
  }
  console.log("\nNext (manual) — see CLONE_CHECKLIST.md:");
  const nextSrc =
    checklistSrc || (existsSync(CHECKLIST_PATH) ? await readFile(CHECKLIST_PATH, "utf8") : "");
  const next = listNextUncheckedFrom(nextSrc, 6);
  for (const item of next) {
    const id = item.id ? ` [${item.id}]` : "";
    console.log(`  - [ ]${id} ${item.text}`);
  }
  console.log(`
Suggested order:
  1. Instant is initialized from the pasted app ID in .env.local (INSTANT_APP_ID / VITE_INSTANT_APP_ID)
  2. bunx instant-cli login  (only if you still need to push schema/perms)
  3. bunx instant-cli push schema && bunx instant-cli push perms
     (only on a new or empty app — this schema drop is destructive)
  4. Configure Google OAuth origins + Instant callback
  5. Replace public/vitr/logo-big.webp + public/vitr/logo-small.webp
  6. Create a Portainer Git stack and point Cloudflare Tunnel at WEB_PORT

Access mode is ${accessMode}. Flip PUBLIC_READ in instant.perms.ts and re-push perms to switch later.
`);
}

/**
 * @param {string} slug
 */
function exampleEnvContents(slug) {
  return `# Portainer: Stacks → Environment variables → Load variables from .env file
# Local Compose: cp example.env .env
#
# This stack is the PWA only. Instant is already hosted elsewhere.
# Cloudflare Tunnel should point the app hostname at WEB_PORT.

WEB_PORT=8088
COMPOSE_PROJECT_NAME=${slug}

VITE_INSTANT_APP_ID=
VITE_INSTANT_API_URI=https://instant.example.com
# VITE_INSTANT_WEBSOCKET_URI=
VITE_INSTANT_GOOGLE_CLIENT_NAME=google-web
`;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
