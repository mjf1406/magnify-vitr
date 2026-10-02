# Clone checklist

Follow this after cloning the template into a **new** git remote. Paths are relative to the repo root.

**Automated start:** run `bun run post-clone` to rewrite brand identity, write `.env.local` and `.env.example`, set `PUBLIC_READ`, optionally install deps, and check off the items it completed. Then finish the remaining boxes here.

Do **not** reuse another clone’s Instant app or copy `.env` / `.env.local` secrets from another machine.

---

## 1. Identity

<!-- clone:identity-remote -->

- [ ] New git remote; do not copy secrets from another machine

<!-- clone:identity-license -->

- [ ] License reviewed (`LICENSE.md` is MIT — change only if you want a different license)

<!-- clone:identity-package -->

- [ ] `package.json` name / description / author / repository updated

<!-- clone:identity-app-config -->

- [ ] `shared/appConfig.ts` fields set for the new product (`name`, `slug`, URLs, …)

<!-- clone:identity-title -->

- [ ] `index.html` title updated

<!-- clone:identity-footer-tagline -->

- [ ] `common.footerTagline` updated in all locales under `src/i18n/resources/`

<!-- clone:identity-self-host-docs -->

- [ ] `docs/SELF_HOSTING.md` Portainer/repo examples retargeted

<!-- clone:identity-compose -->

- [ ] `docker-compose.yml` / `example.env` instance names updated

<!-- clone:env-example -->

- [ ] `.env.example` present with Vite-side vars documented

`bun run post-clone` marks the identity items it edits. Product brand: `public/vitr/` (`logo-big.webp`, `logo-small.webp`).

<!-- clone:brand-assets -->

- [ ] Brand assets + favicon replaced (or intentionally kept)

---

## 2. Install

```bash
vp install
# or: bun install
```

<!-- clone:install-deps -->

- [ ] `vp install` / `bun install` completed with no errors

---

## 3. InstantDB (existing shared deployment)

This template already has `instant.schema.ts` and `instant.perms.ts`. Create or select a **new** Instant app on the shared Instant deployment. Each clone needs its own `app_id`.

```bash
# After post-clone, INSTANT_CLI_* are in .env.local
bunx instant-cli login
bunx instant-cli push schema
bunx instant-cli push perms
```

Pushing this reduced schema to an app that still has classroom data is **destructive**. The wizard does not push automatically.

<!-- clone:instant-new-app -->

- [ ] Created or selected a **new** Instant app (not another clone’s app)

<!-- clone:instant-env-local -->

- [ ] `.env.local` has `INSTANT_APP_ID` / `VITE_INSTANT_APP_ID` (paste an existing app ID). Self-host Instant adds `VITE_INSTANT_API_URI` and `INSTANT_CLI_*`. No admin token.

<!-- clone:access-mode -->

- [ ] Access mode chosen (`PUBLIC_READ` false = private, true = public-read)

<!-- clone:instant-dev-running -->

- [ ] Instant API is reachable; `vp dev` loads the PWA

Already wired: `instant.schema.ts`, `instant.perms.ts`, `instant.config.ts`, `src/main.tsx`.

---

## 4. Google OAuth

Auth is Google only. The SPA uses `db.auth.createAuthorizationURL` with client name `VITE_INSTANT_GOOGLE_CLIENT_NAME` (default `google-web`). Signup and writes are limited to the allowed email in `shared/access.ts`.

1. Google Cloud Console → OAuth consent screen (match new brand).
2. Credentials → OAuth client ID (Web application).
3. Authorized JavaScript origins: `http://localhost:5173` and the production SPA origin (`APP_CONFIG.appUrl`).
4. Authorized redirect URI: Instant’s callback for that client (from the Instant dashboard).

<!-- clone:google-credentials -->

- [ ] Google client registered in Instant; `VITE_INSTANT_GOOGLE_CLIENT_NAME` matches

<!-- clone:google-redirect -->

- [ ] Redirect URI matches Instant’s Google callback

---

## 5. Theme (shadcn)

```bash
bunx --bun shadcn@latest preset resolve
bunx --bun shadcn@latest apply <preset-code> --only theme,font
```

<!-- clone:theme -->

- [ ] New theme/font applied (or confirmed keeping current tokens)

<!-- clone:theme-background -->

- [ ] `src/style.css` light/dark `--background` still matches `APP_CONFIG.themeColors` / `backgroundColors`

---

## 6. Run and verify

```bash
vp dev
```

<!-- clone:verify-load -->

- [ ] App loads against the **new** `VITE_INSTANT_APP_ID`

<!-- clone:verify-auth -->

- [ ] Allowed Google account signs in; a different Google account is signed out

<!-- clone:verify-brand -->

- [ ] Brand name/logo/favicon/tagline look correct

<!-- clone:verify-theme -->

- [ ] Theme looks correct in light and dark

<!-- clone:verify-files -->

- [ ] File upload / rename / delete works; public-read clones can upload to `public/`

<!-- clone:verify-access -->

- [ ] Private clones redirect `/` to login; public-read clones show the public shell without login

<!-- clone:verify-check -->

- [ ] `vp check` and `vp test` pass after your edits

---

## 7. Production (when ready)

<!-- clone:prod-instant -->

- [ ] Instant prod app + `instant-cli push schema` / `push perms` (empty app only)

<!-- clone:prod-google -->

- [ ] Prod Google OAuth origins + Instant client + redirect URI

<!-- clone:prod-urls -->

- [ ] `APP_CONFIG` production URLs set

<!-- clone:prod-host -->

- [ ] Portainer Git stack built; Cloudflare Tunnel points the hostname at `WEB_PORT`

---

## Env quick reference

Vite / `.env.local`: `INSTANT_APP_ID` and `VITE_INSTANT_APP_ID` (required — paste an existing app ID). Optional: `VITE_INSTANT_API_URI`, `VITE_INSTANT_WEBSOCKET_URI`, `VITE_INSTANT_GOOGLE_CLIENT_NAME`, `INSTANT_CLI_*` for self-hosted Instant.

Portainer web service: the same `VITE_INSTANT_*` values. No admin token.

See [`.env.example`](./.env.example) and [`docs/SELF_HOSTING.md`](./docs/SELF_HOSTING.md).
