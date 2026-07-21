# Weather-Testbed

A simple map test website for the National Wildfire Tracking Team.

It renders an interactive map with [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
and lets you switch base styles and drop a marker to read coordinates.

## Features

- Interactive pan/zoom map with multiple selectable base styles
- Click anywhere to drop a marker and read its latitude/longitude
- **Live weather-warnings overlay** — toggle on real-time National Weather
  Service (NWS) warning perimeters across the US, color-coded by severity, that
  drape over the 3D terrain. Click a warning to see its event, area, and expiry.
- **NEXRAD Level 2 radar** — toggle on the WSR-88D radar network: every station
  is plotted on the map, and clicking one downloads and renders its most recent
  volume scan. A control at the top of the map switches between base
  **reflectivity** and base **velocity** (green toward the radar, red away).
- **3D buildings** — toggle extruded building footprints (from free
  OpenStreetMap data bundled in Mapbox's standard vector tiles) across the US
  and worldwide. Zoom in and tilt the map to see them.
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

## NEXRAD Level 2 radar

Toggling **Radar (NEXRAD Level 2)** in the sidebar plots every WSR-88D radar
site (from the bundled station list in `src/radarStations.js`) as a dot on the
map and reveals a small control at the top of the map. **Click a station dot**
to load and draw its latest scan; clicking it again clears it. Only one
station's data is shown at a time.

### Where the data comes from

Everything runs in the browser with no API key and no server of our own:

1. When you select a station, the app finds that site's most recent volume in
   Unidata's real-time chunk bucket on AWS S3
   (`unidata-nexrad-level2-chunks`, public and CORS-enabled). The bucket
   delivers each volume as sequentially numbered chunks
   (`SITE/VOLUME/YYYYMMDD-HHMMSS-SEQ-{S,I,E}`). Volume numbers cycle 1→999, so
   the newest volume is the one just before the largest gap in the retained
   set, not the highest number.
2. The chunks for that volume are downloaded and concatenated into a standard
   Archive Level 2 stream (`AR2V…` header + bzip2-compressed radial records)
   and parsed with the
   [`nexrad-level-2-data`](https://github.com/netbymatt/nexrad-level-2-data)
   library, which is loaded on demand as a separate bundle chunk.
3. The lowest reflectivity tilt (or the lowest Doppler tilt for velocity) is
   rendered to an image and draped over the map at the station's location.

### Reflectivity vs. velocity

The top-of-map control is a two-way toggle:

- **Reflectivity** — precipitation intensity in dBZ, on the standard NWS color
  ramp (blues → greens → yellows → reds → magenta).
- **Velocity** — base radial velocity, colored **green for motion toward the
  radar** (inbound) and **red for motion away** (outbound), with brightness
  scaling with speed and near-zero shown grey. This is the classic velocity
  presentation for spotting rotation and wind couplets.

Switching products re-renders the already-downloaded volume, so it does not
re-fetch. While a station stays selected its scan auto-refreshes every few
minutes.

### Rendering approach

Radar data is polar (radials × range gates). Rather than draw a polygon per
gate (over a million of them), `src/radarRender.js` reverse-maps each output
pixel: a square image centered on the radar is filled by converting each
pixel's offset to an azimuth and range, looking up the gate value, and applying
the color ramp. The square is then placed on the map using geographic corners
derived from the scan's maximum range, so it lines up with the ground near the
station. Because the parser is a Node/CommonJS library that uses `Buffer`, the
`buffer` package is bundled and installed on `globalThis` in `src/radar.js`,
and Vite aliases `global` to `globalThis` (see `vite.config.js`).

## Weather warnings overlay

Toggling **Weather warnings** in the sidebar fetches active alerts from the
free, key-less [NWS alerts API](https://www.weather.gov/documentation/services-web-api)
(`https://api.weather.gov/alerts/active`) directly from the browser (the API
sends permissive CORS headers). Only alerts that carry real polygon geometry —
the "storm-based" warnings such as Tornado, Severe Thunderstorm, Flash Flood and
Marine warnings — are drawn, since those are the ones with a meaningful
perimeter. The data auto-refreshes every 3 minutes while the overlay is on.

Each warning is rendered as a translucent fill plus a colored perimeter line,
color-coded by NWS `severity` (Extreme → Unknown). Both layers are 2D
fill/line layers, which Mapbox GL JS **drapes onto the 3D terrain**, so the
perimeters follow the elevation of the ground rather than floating above it.
They also set `*-emissive-strength: 1` so the overlay stays bright and legible
instead of being darkened by terrain lighting. Click any warning polygon for a
popup with the event name, affected area, expiry time, and issuing office.

## 3D buildings

Toggling **3D buildings** in the sidebar extrudes building footprints into 3D.
This needs **no extra software, API key, or paid service** beyond the Mapbox
token the map already uses: Mapbox's standard vector tiles bundle
[OpenStreetMap](https://www.openstreetmap.org/) building footprints in the
`composite` source's `building` source-layer, each carrying `height` and
`min_height` attributes. The toggle adds a `fill-extrusion` layer that reads
those attributes, so buildings appear across the entire US (and the rest of the
world) for free.

Because the building geometry only exists in the tiles at high zoom, the layer
has a `minzoom` and the extrusion height eases in around zoom 15 to avoid a hard
pop. **Zoom in and tilt the map** (enable *Rotate & pitch*, then drag) to see
the buildings in 3D. The layer is inserted beneath the first label layer so
street and place labels stay readable on top.

## Files

| File / dir       | Purpose                                             |
| ---------------- | --------------------------------------------------- |
| `index.html`     | Page markup and Vite entry point                    |
| `src/main.js`    | Map initialization, controls, marker handling       |
| `src/weatherWarnings.js` | Live NWS weather-warnings overlay (fetch + layers) |
| `src/radar.js`   | NEXRAD Level 2 radar overlay (stations, fetch, product control) |
| `src/radarRender.js` | Renders a polar radar sweep to an RGBA image + color ramps |
| `src/radarStations.js` | Bundled WSR-88D station coordinates             |
| `src/config.js`  | Mapbox token (env-driven) and map defaults          |
| `src/styles.css` | Styling for the map and control panel               |
| `vite.config.js` | Build configuration (relative base, output to dist) |
| `package.json`   | Dependencies and `dev` / `build` / `preview` scripts |

## Notes on the token

The Mapbox token is used from the browser, so it is visible to clients. Only use
a **public** token (`pk.`). You can restrict a public token by URL in the Mapbox
dashboard to limit where it may be used. Never commit a secret token (`sk.`).
