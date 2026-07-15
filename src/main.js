import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./styles.css";
import { CONFIG } from "./config.js";
import {
  enableWeatherWarnings,
  disableWeatherWarnings,
  reapplyWeatherWarnings,
} from "./weatherWarnings.js";

const token = CONFIG.MAPBOX_TOKEN;
const center = CONFIG.INITIAL_CENTER || [-98.35, 39.5];
const zoom = CONFIG.INITIAL_ZOOM || 3.5;
const style = CONFIG.DEFAULT_STYLE || "mapbox://styles/mapbox/outdoors-v12";

const warning = document.getElementById("token-warning");
const coordsDisplay = document.getElementById("coords-display");

if (!token || token.indexOf("pk.") !== 0) {
  if (warning) warning.hidden = false;
} else {
  mapboxgl.accessToken = token;

  const map = new mapboxgl.Map({
    container: "map",
    style,
    center,
    zoom,
  });

  // Expose the map instance for quick console debugging in this testbed.
  window.map = map;

  map.addControl(new mapboxgl.NavigationControl(), "top-left");
  map.addControl(
    new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
    }),
    "top-left"
  );
  map.addControl(new mapboxgl.ScaleControl());

  let marker = null;

  map.on("click", (e) => {
    const lng = e.lngLat.lng.toFixed(4);
    const lat = e.lngLat.lat.toFixed(4);

    if (marker) {
      marker.setLngLat(e.lngLat);
    } else {
      marker = new mapboxgl.Marker({ color: "#f97316" }).setLngLat(e.lngLat);
      marker.addTo(map);
    }

    marker
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(
          "Lng: " + lng + "<br>Lat: " + lat
        )
      )
      .togglePopup();

    coordsDisplay.textContent = "Lng: " + lng + ", Lat: " + lat;
  });

  const styleSelect = document.getElementById("style-select");
  if (styleSelect) {
    styleSelect.value = style;
    styleSelect.addEventListener("change", () => {
      map.setStyle(styleSelect.value);
    });
  }

  setupToggles(map);
}

// Declarative registry of sidebar toggles. To add a new toggle, add a
// checkbox with a matching `data-toggle` attribute in index.html and a new
// entry here. Set `styleDependent: true` for toggles that add sources/layers
// (those get re-applied automatically whenever the map style changes).
function setupToggles(map) {
  const statusEl = document.getElementById("warnings-status");
  const legendEl = document.getElementById("warnings-legend");

  const showWarningsStatus = (status, detail) => {
    if (!statusEl) return;
    if (status === "loading") {
      statusEl.hidden = false;
      statusEl.textContent = "Loading live warnings…";
      statusEl.classList.remove("is-error");
    } else if (status === "ready") {
      statusEl.hidden = false;
      const count = (detail && detail.count) || 0;
      statusEl.textContent =
        count === 1
          ? "1 active warning with a perimeter"
          : `${count} active warnings with perimeters`;
      statusEl.classList.remove("is-error");
    } else if (status === "error") {
      statusEl.hidden = false;
      statusEl.textContent = "Could not load warnings — will retry.";
      statusEl.classList.add("is-error");
    } else {
      statusEl.hidden = true;
      statusEl.textContent = "";
      statusEl.classList.remove("is-error");
    }
  };

  const toggles = {
    weatherWarnings: {
      styleDependent: true,
      apply(enabled) {
        if (legendEl) legendEl.hidden = !enabled;
        if (enabled) {
          enableWeatherWarnings(map, showWarningsStatus);
        } else {
          disableWeatherWarnings(map);
        }
      },
      reapply(enabled) {
        if (enabled) reapplyWeatherWarnings(map);
      },
    },

    terrain: {
      styleDependent: true,
      apply(enabled) {
        if (enabled) {
          if (!map.getSource("mapbox-dem")) {
            map.addSource("mapbox-dem", {
              type: "raster-dem",
              url: "mapbox://mapbox.mapbox-terrain-dem-v1",
              tileSize: 512,
              maxzoom: 14,
            });
          }
          map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
        } else {
          map.setTerrain(null);
        }
      },
    },

    sky: {
      styleDependent: true,
      apply(enabled) {
        if (enabled) {
          if (!map.getLayer("sky")) {
            map.addLayer({
              id: "sky",
              type: "sky",
              paint: {
                "sky-type": "atmosphere",
                "sky-atmosphere-sun": [0.0, 90.0],
                "sky-atmosphere-sun-intensity": 15,
              },
            });
          }
        } else if (map.getLayer("sky")) {
          map.removeLayer("sky");
        }
      },
    },

    scrollZoom: {
      apply(enabled) {
        if (enabled) map.scrollZoom.enable();
        else map.scrollZoom.disable();
      },
    },

    rotate: {
      apply(enabled) {
        if (enabled) {
          map.dragRotate.enable();
          map.touchZoomRotate.enableRotation();
        } else {
          map.dragRotate.disable();
          map.touchZoomRotate.disableRotation();
        }
      },
    },
  };

  const inputs = Array.from(document.querySelectorAll("[data-toggle]"));

  const applyToggle = (input) => {
    const config = toggles[input.dataset.toggle];
    if (config) config.apply(input.checked);
  };

  inputs.forEach((input) => {
    input.addEventListener("change", () => applyToggle(input));
    // Apply the initial checked state for non-style-dependent toggles (e.g.
    // scroll zoom / rotate default on). Style-dependent toggles are applied by
    // the `style.load` handler below instead, so we don't touch the style
    // before it has finished loading.
    const config = toggles[input.dataset.toggle];
    if (config && !config.styleDependent) applyToggle(input);
  });

  // Re-apply style-dependent toggles after a style change, since setStyle
  // clears custom sources, layers, and terrain.
  map.on("style.load", () => {
    inputs.forEach((input) => {
      const config = toggles[input.dataset.toggle];
      if (!config || !config.styleDependent) return;
      // Prefer a lighter-weight reapply handler (reuses cached data) when a
      // toggle provides one; otherwise fall back to the normal apply.
      if (config.reapply) config.reapply(input.checked);
      else config.apply(input.checked);
    });
  });
}
