import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./styles.css";
import { CONFIG } from "./config.js";
import {
  enableWeatherWarnings,
  disableWeatherWarnings,
  reapplyWeatherWarnings,
} from "./weatherWarnings.js";
import {
  enableRadar,
  disableRadar,
  reapplyRadar,
  radarStatusToControl,
} from "./radar.js";

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

  const radarStatusEl = document.getElementById("radar-status");
  const showRadarStatus = (state, detail) => {
    // Keep the top-of-map control's status line in sync…
    radarStatusToControl(state, detail);
    // …and mirror a short line into the sidebar.
    if (!radarStatusEl) return;
    if (state === "loading") {
      radarStatusEl.hidden = false;
      radarStatusEl.textContent = `Loading ${detail && detail.id ? detail.id : "radar"}…`;
      radarStatusEl.classList.remove("is-error");
    } else if (state === "ready") {
      radarStatusEl.hidden = false;
      radarStatusEl.textContent = `Showing ${detail.id} ${
        detail.product === "velocity" ? "velocity" : "reflectivity"
      }`;
      radarStatusEl.classList.remove("is-error");
    } else if (state === "error") {
      radarStatusEl.hidden = false;
      radarStatusEl.textContent = `${detail && detail.id ? detail.id + ": " : ""}${
        (detail && detail.message) || "load failed"
      }`;
      radarStatusEl.classList.add("is-error");
    } else {
      radarStatusEl.hidden = false;
      radarStatusEl.textContent = "Click a station dot to load its latest scan.";
      radarStatusEl.classList.remove("is-error");
    }
  };

  const toggles = {
    radar: {
      styleDependent: true,
      apply(enabled) {
        if (radarStatusEl) radarStatusEl.hidden = !enabled;
        if (enabled) enableRadar(map, showRadarStatus);
        else disableRadar(map);
      },
      reapply(enabled) {
        if (enabled) reapplyRadar(map);
      },
    },

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

    buildings: {
      styleDependent: true,
      apply(enabled) {
        if (enabled) addBuildings3d(map);
        else removeBuildings3d(map);
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

// 3D buildings, drawn from the free OpenStreetMap building footprints that
// Mapbox bundles into its standard vector tiles (the "composite" source's
// "building" source-layer, with `height`/`min_height` attributes). Extruding
// them costs nothing beyond the Mapbox token already in use and covers the
// entire US (and the rest of the world). Buildings only exist in the tiles at
// high zoom, hence the minzoom below — zoom in and tilt the map to see them.
const BUILDINGS_LAYER_ID = "3d-buildings";
const BUILDINGS_SOURCE = "composite";
const BUILDINGS_SOURCE_LAYER = "building";

function addBuildings3d(map) {
  if (map.getLayer(BUILDINGS_LAYER_ID)) return;
  // Every base style in this testbed ships the composite/building data, but
  // guard anyway so a style without it fails gracefully instead of throwing.
  if (!map.getSource(BUILDINGS_SOURCE)) return;

  // Insert the extrusions beneath the first symbol (label) layer so street
  // and place labels stay readable on top of the buildings.
  const layers = map.getStyle().layers || [];
  const labelLayer = layers.find(
    (l) => l.type === "symbol" && l.layout && l.layout["text-field"]
  );
  const beforeId = labelLayer ? labelLayer.id : undefined;

  map.addLayer(
    {
      id: BUILDINGS_LAYER_ID,
      source: BUILDINGS_SOURCE,
      "source-layer": BUILDINGS_SOURCE_LAYER,
      filter: ["==", ["get", "extrude"], "true"],
      type: "fill-extrusion",
      minzoom: 14,
      paint: {
        "fill-extrusion-color": "#aab2bd",
        // Grow the extrusion in as it becomes visible to avoid a hard pop.
        "fill-extrusion-height": [
          "interpolate",
          ["linear"],
          ["zoom"],
          14,
          0,
          15.05,
          ["get", "height"],
        ],
        "fill-extrusion-base": [
          "interpolate",
          ["linear"],
          ["zoom"],
          14,
          0,
          15.05,
          ["get", "min_height"],
        ],
        "fill-extrusion-opacity": 0.85,
      },
    },
    beforeId
  );
}

function removeBuildings3d(map) {
  if (map.getLayer(BUILDINGS_LAYER_ID)) map.removeLayer(BUILDINGS_LAYER_ID);
}
