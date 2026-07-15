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
(where `index.html` lives).

If you connect the repo to Netlify:

1. Leave the **Build command** empty.
2. Set the **Publish directory** to the repository root (`.`). The
   `netlify.toml` already does this for you.
3. Deploy — the site URL will appear in the Netlify dashboard.

> **Why you saw "Page not found":** without a publish directory set, Netlify
> guesses one (often an empty or nonexistent build folder), so there is no
> `index.html` to serve and every request 404s. The `netlify.toml` in this repo
> pins the publish directory to the root and fixes that.

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
