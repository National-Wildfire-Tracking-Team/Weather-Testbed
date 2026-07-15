# Weather-Testbed

A simple map test website for the National Wildfire Tracking Team.

It renders an interactive [Leaflet](https://leafletjs.com/) map on top of
OpenStreetMap tiles and adds optional weather overlay layers (clouds,
precipitation, temperature, wind) powered by the OpenWeatherMap tile API.

## Features

- Interactive pan/zoom map (no API key needed for the base map)
- Click anywhere to drop a marker and read its latitude/longitude
- Toggleable weather overlays (requires an OpenWeatherMap API key)
- Responsive layout that works on desktop and mobile

## Getting started

This is a static site — no build step or server-side code required.

1. **Set your Mapbox token.** Open [`config.js`](config.js) and set
   `MAPBOX_TOKEN` to a **public** token (starts with `pk.`) from
   [account.mapbox.com/access-tokens](https://account.mapbox.com/access-tokens/).
   A token is already included for testing.

2. **Serve the files.** Any static file server works. For example:

   ```bash
   python3 -m http.server 8000
   ```

   Then open <http://localhost:8000> in your browser.

## Deploying to GitHub Pages

This repo includes a workflow ([`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml))
that publishes the static site to GitHub Pages.

**One-time setup:** In the repository, go to **Settings → Pages → Build and
deployment → Source** and select **GitHub Actions**. (The Actions token cannot
enable Pages automatically, so this manual step is required once.) After that,
every push to `main` deploys the site, and the live URL appears in the workflow
run and under Settings → Pages.

## Deploying to GitHub Pages

This repo includes a workflow ([`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml))
that publishes the static site to GitHub Pages automatically.

To enable it (one-time setup):

1. In the repository, go to **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Push to `main` (merge the PR) or re-run the workflow from the **Actions** tab.
   The site URL will appear in the workflow run and under Settings → Pages.

> **Why you saw "page not found":** the site files only lived on the feature
> branch, so `main` had no `index.html` to serve. Merging the PR (or letting the
> workflow deploy this branch) fixes that. If your Pages source was set to
> "Deploy from a branch", switch it to "GitHub Actions" as above.

## Deploying to Netlify

This repo includes a [`netlify.toml`](netlify.toml) so Netlify serves the site
correctly out of the box. Because this is a plain static site, there is **no
build step** and the files are published straight from the repository root
(where `index.html` lives). The config also adds a `/* -> /index.html 200`
rewrite so no URL ever hits Netlify's built-in "Page not found" page.

If you connect the repo to Netlify:

1. Leave the **Build command** empty.
2. Set the **Publish directory** to the repository root (`.`). The
   `netlify.toml` already does this for you.
3. Deploy — the site URL will appear in the Netlify dashboard.

### Still seeing "Page not found"? Troubleshooting checklist

Based on Netlify's official
[Page-not-found support guide](https://answers.netlify.com/t/support-guide-i-ve-deployed-my-site-but-i-still-see-page-not-found/125),
here's what to verify:

- **Deploy the branch that has `netlify.toml`.** The config lives in this
  branch/PR. If Netlify builds `main`, merge the PR (or point the Netlify site
  at this branch) so the config is present in the deploy.
- **Publish directory.** In **Site settings → Build & deploy → Continuous
  deployment**, the publish directory must be the repo root. `netlify.toml`
  overrides the UI, but clear any stale value like `dist` or `build` to avoid
  confusion.
- **Base directory.** If a **Base directory** is set in the UI, the publish path
  is resolved relative to it. Leave it empty so `publish = "."` means the repo
  root.
- **Files are at the top level.** `index.html` must not be nested in a subfolder
  — in this repo it is at the root, which is correct.
- **Confirm the files actually deployed.** Open the deploy in Netlify and use
  the **Deploy file browser** (or download the deploy) to confirm `index.html`
  is present at the root of the published output.
- **Clear your browser cache / try an incognito window.** A cached 404 can
  persist after the fix is deployed.

> **Why you saw "Page not found":** without a correct publish directory, Netlify
> can't find `index.html` and every request 404s. The `netlify.toml` in this
> repo pins the publish directory to the root and adds an SPA-style fallback so
> the map always loads.

## Files

| File         | Purpose                                          |
| ------------ | ------------------------------------------------ |
| `index.html` | Page markup, style switcher, and controls        |
| `styles.css` | Styling for the map and control panel            |
| `app.js`     | Map initialization, controls, marker handling    |
| `config.js`  | Mapbox token and map defaults                     |

## Notes on the token

The Mapbox token is used from the browser, so it is visible to clients. Only use
a **public** token (`pk.`). You can restrict a public token by URL in the Mapbox
dashboard to limit where it may be used. Never commit a secret token (`sk.`).
