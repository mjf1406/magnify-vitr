# vitr

[![AI Level 3](https://ai-level.dev/badge/standard/3.svg)](https://ai-level.dev/level-3)

A **single-user InstantDB PWA** template. Package manager is **bun** only.

Each clone is one app on one subdomain. It has its own Instant `app_id` and talks to Instant you already host. This repo does not run Instant, Postgres, MinIO, or an admin API.

The allowed Google account is `michael.fitzgerald.1406@gmail.com` (`shared/access.ts`).

---

## Clone this template

1. Fork or clone into a **new** git remote. Do not copy another clone’s `.env` / `.env.local`.
2. Create or select an Instant app in the dashboard. Copy its **app ID**.
3. Install Bun if you need it, then run the wizard:

   ```bash
   bun run post-clone
   ```

4. Finish the leftover boxes in [`CLONE_CHECKLIST.md`](./CLONE_CHECKLIST.md).
5. When you are ready to host it, follow [`docs/SELF_HOSTING.md`](./docs/SELF_HOSTING.md) (Portainer + Cloudflare Tunnel).

The wizard never pushes schema or permissions. Push those yourself, and only to a **new or empty** Instant app.

---

## What the wizard asks

`bun run post-clone` sets the product identity and Instant connection. It writes a gitignored `.env.local` (no admin token).

**Brand**

- Display name, slug, GitHub repo URL
- App URL and marketing / legal URLs
- Footer tagline
- Access mode: `private` or `public-read`

**Instant**

- **App ID** — paste an existing UUID. That is enough to initialize Instant.
- Instant API URL — leave blank for Instant Cloud. Fill this in only for a self-hosted Instant origin.
- Google OAuth client name (default `google-web`)

Press Enter to keep a value that is already in `.env.local`.

Dry run (no writes):

```bash
bun scripts/post-clone.mjs --dry-run
```

Non-interactive (app ID only):

```bash
bun scripts/post-clone.mjs \
  --name MyApp \
  --slug my-app \
  --github https://github.com/org/repo \
  --app-id <existing-app-id> \
  --access-mode private \
  --no-install
```

Add `--instant-api` and `--cli-dash` only if this clone uses a self-hosted Instant API.

---

## After the wizard

```bash
vp install          # if the wizard did not install deps
vp dev              # local PWA
```

If the Instant app is new or empty, log the CLI in and push:

```bash
bunx instant-cli login
bunx instant-cli push schema
bunx instant-cli push perms
```

Then:

1. Replace `public/vitr/logo-big.webp` and `public/vitr/logo-small.webp`.
2. Add Google OAuth origins (`http://localhost:5173` and your app URL) and Instant’s callback URL.
3. Tick the remaining items in [`CLONE_CHECKLIST.md`](./CLONE_CHECKLIST.md).

Pushing this schema onto an app that still has classroom data **deletes that data**.

---

## Access modes

Each clone pushes its own Instant permissions.

| Mode                  | Visitors                                                           | Writes               |
| --------------------- | ------------------------------------------------------------------ | -------------------- |
| **Private** (default) | Must sign in with the allowed Google account                       | Allowed account only |
| **Public-read**       | Can read published files and `public/` storage paths without login | Allowed account only |

Switch later: flip `PUBLIC_READ` in `instant.perms.ts`, then `bunx instant-cli push perms`.

Account deletion is not in the PWA. Delete `$users` in the Instant dashboard.

---

## Day-to-day commands

| Command              | Purpose                             |
| -------------------- | ----------------------------------- |
| `bun run post-clone` | First-time identity + Instant setup |
| `vp install`         | Install deps after pull             |
| `vp dev`             | Local PWA                           |
| `vp run push:schema` | Push Instant schema                 |
| `vp run push:perms`  | Push Instant permissions            |
| `vp check`           | Format                              |
| `vp test`            | Tests                               |
| `bun run typecheck`  | `tsc -b`                            |

---

## What to keep

Keep Instant hooks (`db.useQuery` / `db.transact`), the PWA shell, and the `PUBLIC_READ` flag.

Do not add Electron, a Bun admin server, classroom/roles, Polar, or an admin token in the web env. Keep [`.cursor/rules/`](./.cursor/rules/).

More deploy detail: [`docs/SELF_HOSTING.md`](./docs/SELF_HOSTING.md). Agents: [`AGENTS.md`](./AGENTS.md).
