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
