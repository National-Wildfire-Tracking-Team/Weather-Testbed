# Weather-Testbed

A simple map test website for the National Wildfire Tracking Team.

It renders an interactive map with [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
and lets you switch base styles and drop a marker to read coordinates.

## Features

- Interactive pan/zoom map with multiple selectable base styles
- Click anywhere to drop a marker and read its latitude/longitude
- Navigation, geolocation, and scale controls
- Responsive layout that works on desktop and mobile

## Tech / build

The site is built with [Vite](https://vite.dev/). Dependencies (including
`mapbox-gl`) are installed from npm and bundled/minified into a small set of
hashed, cache-friendly assets in `dist/`. This replaces the previous approach of
loading libraries from a CDN with `<script>` tags, giving us a real build
pipeline as the app grows.

### Prerequisites

- [Node.js](https://nodejs.org/) 20+ and npm

### Getting started

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **(Optional) Set your Mapbox token.** Copy `.env.example` to `.env.local` and
   set a **public** token (starts with `pk.`) from
   [account.mapbox.com/access-tokens](https://account.mapbox.com/access-tokens/):

   ```bash
   cp .env.example .env.local
   # then edit .env.local and set VITE_MAPBOX_TOKEN
   ```

   A public token is already baked into `src/config.js` as a fallback for
   testing, so this step is optional to get started.

3. **Start the dev server** (hot reload):

   ```bash
   npm run dev
   ```

   Then open the URL Vite prints (defaults to <http://localhost:5173>).

### Build for production

```bash
npm run build      # outputs the static site to dist/
npm run preview    # serve the built dist/ locally to verify it
```

## Deploying to GitHub Pages

This repo includes a workflow ([`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml))
that installs dependencies, runs `npm run build`, and publishes the generated
`dist/` directory to GitHub Pages.

**One-time setup:** In the repository, go to **Settings → Pages → Build and
deployment → Source** and select **GitHub Actions**. (The Actions token cannot
enable Pages automatically, so this manual step is required once.) After that,
every push to `main` builds and deploys the site, and the live URL appears in the
workflow run and under Settings → Pages.

To keep the token out of the repo you can add a `VITE_MAPBOX_TOKEN` repository
secret (**Settings → Secrets and variables → Actions**); the workflow passes it
to the build. Because Vite emits **relative** asset URLs (`base: "./"`), the
build works both at the GitHub Pages project subpath (`/Weather-Testbed/`) and at
a domain root.

## Deploying to Netlify

This repo includes a [`netlify.toml`](netlify.toml) that tells Netlify to run the
Vite build and publish the `dist/` directory:

- **Build command:** `npm run build`
- **Publish directory:** `dist`

It also adds a `/* -> /index.html 200` rewrite so no URL hits Netlify's built-in
"Page not found" page. To keep the token out of the repo, set `VITE_MAPBOX_TOKEN`
under **Site settings → Build & deploy → Environment**.

### Netlify isn't deploying new merges to `main`? Troubleshooting checklist

If the site is stuck on an old version and new merges to `main` never trigger a
deploy, the cause is almost always a **Netlify site / GitHub connection**
setting rather than anything in this repo. `netlify.toml` only controls *how* a
build runs (build command, publish directory, redirects); it cannot set *which*
branch Netlify watches or turn auto-deploys on. Work through these in the
Netlify dashboard:

1. **Production branch must be `main`.** Site settings → Build & deploy →
   Continuous deployment → **Branches and deploy contexts**. If the "Production
   branch" is anything else (e.g. `master` or an old branch), merges to `main`
   will never deploy. Set it to `main` and save.
2. **Builds must not be stopped / auto-publish must be on.** Site settings →
   Build & deploy → Continuous deployment. If builds are stopped or
   auto-publishing is off, new commits are ignored — re-enable them. Also check
   Site overview for a **"Stop builds"/locked deploy** banner.
3. **The GitHub connection / webhook must be healthy.** On GitHub, go to the
   repo → **Settings → Webhooks** and look for a Netlify webhook. If it shows a
   red ✗ or recent failed deliveries, the push notifications aren't reaching
   Netlify. Fix it by reconnecting in Netlify: Site settings → Build & deploy →
   Continuous deployment → **Manage repository / Link to a different
   repository**, and make sure the **Netlify GitHub App** is installed and has
   access to `National-Wildfire-Tracking-Team/Weather-Testbed`.
4. **The site must be linked to this repo (not a fork).** Confirm the linked
   repository and branch under Continuous deployment match this repository.
5. **Kick off a manual deploy to confirm the pipeline works.** Deploys →
   **Trigger deploy → Deploy site** (or **Clear cache and deploy site**). If a
   manual deploy succeeds but pushes still don't, the problem is the webhook
   (step 3), not the build.
6. **Check the deploy log for build failures.** A failing `npm run build` will
   leave the old version live. Open the latest deploy and confirm it produced
   `dist/index.html`.

> Note: this repo also deploys to **GitHub Pages** (see below), which runs on a
> separate pipeline. A working Pages deploy does not mean Netlify is deploying —
> verify you're looking at the Netlify URL when checking for updates.

### Still seeing "Page not found"? Troubleshooting checklist

- **Deploy the branch that has `netlify.toml`.** If Netlify builds `main`, merge
  the PR (or point the Netlify site at this branch) so the config is present.
- **Publish directory must be `dist`.** `netlify.toml` sets this, but clear any
  stale UI value (like `.`, `build`, or `public`) to avoid confusion.
- **Base directory.** If a **Base directory** is set in the UI, the publish path
  is resolved relative to it. Leave it empty so `publish = "dist"` resolves at
  the repo root.
- **Confirm the build succeeded.** Open the deploy log and confirm
  `npm run build` ran and produced `dist/index.html`.
- **Clear your browser cache / try an incognito window.** A cached 404 can
  persist after the fix is deployed.

## Files

| File / dir       | Purpose                                             |
| ---------------- | --------------------------------------------------- |
| `index.html`     | Page markup and Vite entry point                    |
| `src/main.js`    | Map initialization, controls, marker handling       |
| `src/config.js`  | Mapbox token (env-driven) and map defaults          |
| `src/styles.css` | Styling for the map and control panel               |
| `vite.config.js` | Build configuration (relative base, output to dist) |
| `package.json`   | Dependencies and `dev` / `build` / `preview` scripts |

## Notes on the token

The Mapbox token is used from the browser, so it is visible to clients. Only use
a **public** token (`pk.`). You can restrict a public token by URL in the Mapbox
dashboard to limit where it may be used. Never commit a secret token (`sk.`).
