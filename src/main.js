import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./styles.css";
import { CONFIG } from "./config.js";

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
  const toggles = {
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
    // Apply the initial checked state (e.g. scroll zoom / rotate default on).
    applyToggle(input);
  });

  // Re-apply style-dependent toggles after a style change, since setStyle
  // clears custom sources, layers, and terrain.
  map.on("style.load", () => {
    inputs.forEach((input) => {
      const config = toggles[input.dataset.toggle];
      if (config && config.styleDependent) config.apply(input.checked);
    });
  });
}
