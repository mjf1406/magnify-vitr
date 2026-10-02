# Deploy the PWA (Portainer + Cloudflare Tunnel)

This repo ships a **web-only** Docker image: Vite build + nginx. Instant is already hosted elsewhere. The container injects the Instant `app_id` and API URL at startup.

Do **not** add Postgres, MinIO, Instant, or an admin API back into this compose file.

## What you deploy

| Piece              | Role                                                |
| ------------------ | --------------------------------------------------- |
| This Git stack     | One PWA per subdomain, built from the clone         |
| Shared Instant API | Already running; browsers talk to it over HTTPS/WSS |
| Cloudflare Tunnel  | Maps the app hostname to `WEB_PORT` on the host     |

Each clone needs its own Instant `app_id`. Two clones can share Instant infrastructure, not the same app.

## Access modes

Set during `bun run post-clone`, stored as `PUBLIC_READ` in `instant.perms.ts`:

- **Private** (`PUBLIC_READ = false`): every read and write needs the allowed Google account.
- **Public-read** (`PUBLIC_READ = true`): visitors can read published file records and files under `public/`. Writes still need the allowed account.

To switch later: flip `PUBLIC_READ`, then `bunx instant-cli push perms`.

## First-time Instant setup (once per clone)

1. Open the self-hosted Instant dashboard and create or select an app.
2. Run `bun run post-clone`. Paste the existing `app_id` when asked. That is enough to initialize Instant. Enter Instant API/dashboard URLs only if this clone talks to a self-hosted Instant origin. Also set Google client name, app URL, branding, and access mode.
3. Log the Instant CLI into the self-hosted API/dashboard (`INSTANT_CLI_API_URI` / `INSTANT_CLI_DASH_URI` in `.env.local`).
4. Push schema and permissions **only** if the app is new or empty:

   ```bash
   bunx instant-cli push schema
   bunx instant-cli push perms
   ```

   Pushing this reduced schema onto an app that still has classroom data is destructive. The wizard never pushes automatically.

5. Configure Google OAuth:
   - Authorized JavaScript origins: the PWA origin (`APP_CONFIG.appUrl`) and `http://localhost:5173` for local work.
   - Authorized redirect URI: Instant’s Google callback from the dashboard.

## Option A — Clone and run locally

```bash
git clone <your-fork-or-repo-url>
cd <repo>
cp example.env .env
# set VITE_INSTANT_APP_ID and VITE_INSTANT_API_URI
docker compose up -d --build
```

Open `http://localhost:8088` (or your `WEB_PORT`).

```bash
docker compose logs -f web
docker compose down
```

## Option B — Portainer Git stack

1. Stacks → **Add stack** → **Repository**
2. Repository URL: `https://github.com/mjf1406/vitr`
3. Repository Reference: `refs/heads/master` (or your clone’s branch)
4. Compose path: `docker-compose.yml`
5. Environment variables → **Load variables from .env file** → upload [`example.env`](../example.env) after filling:
   - `WEB_PORT` (default `8088`)
   - `VITE_INSTANT_APP_ID`
   - `VITE_INSTANT_API_URI`
   - optional `VITE_INSTANT_WEBSOCKET_URI`
   - `VITE_INSTANT_GOOGLE_CLIENT_NAME`
6. Deploy and wait for the `web` **build** to finish.
7. Point the existing Cloudflare Tunnel hostname at `localhost:${WEB_PORT}` (or the host port you set).

Do not put an Instant admin token in Portainer. The PWA does not need one.

### Clean rebuild after compose/Dockerfile changes

Portainer often reuses old layers. If a deploy fails or you pulled new git commits:

1. Remove the stack.
2. Optionally prune unused build cache/images on the host:

   ```bash
   docker builder prune -f
   docker image prune -f
   ```

3. Redeploy the Git stack.

## Runtime config

nginx serves `/runtime-env.js` from [`docker/runtime-env.template.js`](../docker/runtime-env.template.js). The entrypoint fills Instant settings from container env so you can change `app_id` or API URL without rebuilding the JS bundle.

The PWA manifest and service worker stay rooted at the app subdomain. There is no LAN-port rewrite.

CSP `connect-src` allows `'self'` plus the Instant HTTPS and WSS origins derived from `VITE_INSTANT_API_URI` / `VITE_INSTANT_WEBSOCKET_URI`. `/health` returns `ok` for the container health check.

## Google sign-in on the deployed origin

After the hostname is live, add that origin to the Google OAuth client and confirm Instant’s callback URL still matches. Sign in with the allowed Google account. A different account is signed out by the UI guard and rejected by CEL.
