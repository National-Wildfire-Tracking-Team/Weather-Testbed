# Weather-Testbed

A simple map test website for the National Wildfire Tracking Team, built with
[Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/).

## Features

- Interactive vector map with pan/zoom and rotation
- Style switcher (Satellite, Outdoors, Streets, Dark, Light)
- Navigation, geolocation, and scale controls
- Click anywhere to drop a marker and read its longitude/latitude
- Responsive layout for desktop and mobile

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
