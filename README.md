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

1. **(Optional) Add a weather API key.** Open [`config.js`](config.js) and set
   `OPENWEATHER_API_KEY` to a free key from
   [openweathermap.org/api](https://openweathermap.org/api). Without a key the
   base map still works; only the weather overlays are disabled.

2. **Serve the files.** Any static file server works. For example:

   ```bash
   python3 -m http.server 8000
   ```

   Then open <http://localhost:8000> in your browser.

   You can also just open `index.html` directly, but serving over HTTP is
   recommended so tile requests behave consistently.

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

## Files

| File         | Purpose                                             |
| ------------ | --------------------------------------------------- |
| `index.html` | Page markup and layer controls                      |
| `styles.css` | Styling for the map and control panel               |
| `app.js`     | Map initialization, marker handling, weather layers |
| `config.js`  | Map defaults and the OpenWeatherMap API key         |

## Notes on the API key

The weather API key is used from the browser to request map tiles, so it is
visible to clients. Only use a key intended for public/client-side tile access
(OpenWeatherMap map-tile keys are). Do not commit private/secret keys here.
