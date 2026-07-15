import mapboxgl from "mapbox-gl";

// Live weather-warnings overlay backed by the National Weather Service (NWS)
// public alerts API. The API is free, needs no key, and sends
// `Access-Control-Allow-Origin: *`, so it can be fetched straight from the
// browser. See https://www.weather.gov/documentation/services-web-api
//
// We only render alerts that carry real polygon geometry ("storm-based
// warnings" such as Tornado, Severe Thunderstorm, Flash Flood and Marine
// warnings). Those are precisely the alerts that have a meaningful perimeter.
// Zone-based advisories without geometry are intentionally skipped.

const NWS_ALERTS_URL =
  "https://api.weather.gov/alerts/active?status=actual&message_type=alert";

const SOURCE_ID = "nws-alerts";
const FILL_LAYER_ID = "nws-alerts-fill";
const LINE_LAYER_ID = "nws-alerts-line";

// Refresh the live data every 3 minutes while the overlay is enabled.
const REFRESH_MS = 3 * 60 * 1000;

// Color the warnings by NWS severity. `severity` is one of Extreme, Severe,
// Moderate, Minor or Unknown.
const SEVERITY_COLORS = {
  Extreme: "#7f1d1d",
  Severe: "#dc2626",
  Moderate: "#f97316",
  Minor: "#facc15",
  Unknown: "#38bdf8",
};

const severityColorExpression = [
  "match",
  ["get", "severity"],
  "Extreme",
  SEVERITY_COLORS.Extreme,
  "Severe",
  SEVERITY_COLORS.Severe,
  "Moderate",
  SEVERITY_COLORS.Moderate,
  "Minor",
  SEVERITY_COLORS.Minor,
  /* Unknown / default */ SEVERITY_COLORS.Unknown,
];

const EMPTY_FEATURE_COLLECTION = { type: "FeatureCollection", features: [] };

// Module-level state so the overlay survives base-style changes and can be
// torn down cleanly.
let enabled = false;
let lastData = EMPTY_FEATURE_COLLECTION;
let refreshTimer = null;
let popup = null;
let inFlight = null;
let statusCallback = null;

function reportStatus(status, detail) {
  if (statusCallback) statusCallback(status, detail);
}

async function fetchAlerts() {
  const res = await fetch(NWS_ALERTS_URL, {
    headers: { Accept: "application/geo+json" },
  });
  if (!res.ok) {
    throw new Error(`NWS API responded with ${res.status}`);
  }
  const data = await res.json();
  const features = (data.features || []).filter(
    (f) => f && f.geometry && f.geometry.type && f.geometry.coordinates
  );
  return { type: "FeatureCollection", features };
}

function addSourceAndLayers(map) {
  if (!map.getSource(SOURCE_ID)) {
    map.addSource(SOURCE_ID, { type: "geojson", data: lastData });
  }

  if (!map.getLayer(FILL_LAYER_ID)) {
    map.addLayer({
      id: FILL_LAYER_ID,
      type: "fill",
      source: SOURCE_ID,
      paint: {
        "fill-color": severityColorExpression,
        "fill-opacity": 0.35,
        // Render the fill at full brightness so terrain hillshade/lighting
        // does not darken the overlay when 3D terrain is enabled.
        "fill-emissive-strength": 1,
      },
    });
  }

  if (!map.getLayer(LINE_LAYER_ID)) {
    map.addLayer({
      id: LINE_LAYER_ID,
      type: "line",
      source: SOURCE_ID,
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": severityColorExpression,
        "line-width": ["interpolate", ["linear"], ["zoom"], 3, 1.5, 8, 3, 12, 4],
        "line-opacity": 0.95,
        // Keep the perimeter outline crisp and bright as it drapes over the
        // 3D terrain surface instead of being dimmed by terrain lighting.
        "line-emissive-strength": 1,
      },
    });
  }
}

function formatTime(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function escapeHtml(value) {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function popupHtml(props) {
  const color = SEVERITY_COLORS[props.severity] || SEVERITY_COLORS.Unknown;
  const ends = formatTime(props.ends || props.expires);
  const lines = [];
  lines.push(
    `<strong class="ww-popup-event">${escapeHtml(
      props.event || "Weather warning"
    )}</strong>`
  );
  lines.push(
    `<span class="ww-popup-badge" style="background:${color}">${escapeHtml(
      props.severity || "Unknown"
    )}</span>`
  );
  if (props.areaDesc) {
    lines.push(`<p class="ww-popup-area">${escapeHtml(props.areaDesc)}</p>`);
  }
  if (ends) {
    lines.push(`<p class="ww-popup-meta">Until ${escapeHtml(ends)}</p>`);
  }
  if (props.senderName) {
    lines.push(`<p class="ww-popup-meta">${escapeHtml(props.senderName)}</p>`);
  }
  return `<div class="ww-popup">${lines.join("")}</div>`;
}

function handleClick(map, e) {
  const feature = e.features && e.features[0];
  if (!feature) return;
  if (popup) popup.remove();
  popup = new mapboxgl.Popup({ offset: 12, maxWidth: "300px" })
    .setLngLat(e.lngLat)
    .setHTML(popupHtml(feature.properties || {}))
    .addTo(map);
}

let onFillClick = null;
let onFillEnter = null;
let onFillLeave = null;

function bindInteractions(map) {
  onFillClick = (e) => handleClick(map, e);
  onFillEnter = () => {
    map.getCanvas().style.cursor = "pointer";
  };
  onFillLeave = () => {
    map.getCanvas().style.cursor = "";
  };
  map.on("click", FILL_LAYER_ID, onFillClick);
  map.on("mouseenter", FILL_LAYER_ID, onFillEnter);
  map.on("mouseleave", FILL_LAYER_ID, onFillLeave);
}

function unbindInteractions(map) {
  if (onFillClick) map.off("click", FILL_LAYER_ID, onFillClick);
  if (onFillEnter) map.off("mouseenter", FILL_LAYER_ID, onFillEnter);
  if (onFillLeave) map.off("mouseleave", FILL_LAYER_ID, onFillLeave);
  onFillClick = onFillEnter = onFillLeave = null;
}

async function refresh(map) {
  if (!enabled) return;
  reportStatus("loading");
  try {
    inFlight = fetchAlerts();
    const data = await inFlight;
    lastData = data;
    if (!enabled) return;
    const source = map.getSource(SOURCE_ID);
    if (source) source.setData(data);
    reportStatus("ready", { count: data.features.length });
  } catch (err) {
    console.error("Failed to load NWS weather warnings:", err);
    reportStatus("error", { message: err.message });
  } finally {
    inFlight = null;
  }
}

/**
 * Enable the overlay: add the source/layers, wire interactions, fetch the
 * live data and start the auto-refresh timer.
 */
export function enableWeatherWarnings(map, onStatus) {
  statusCallback = onStatus || statusCallback;
  enabled = true;
  addSourceAndLayers(map);
  bindInteractions(map);
  refresh(map);
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(() => refresh(map), REFRESH_MS);
}

/**
 * Disable the overlay and remove everything it added.
 */
export function disableWeatherWarnings(map) {
  enabled = false;
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  if (popup) {
    popup.remove();
    popup = null;
  }
  unbindInteractions(map);
  if (map.getLayer(LINE_LAYER_ID)) map.removeLayer(LINE_LAYER_ID);
  if (map.getLayer(FILL_LAYER_ID)) map.removeLayer(FILL_LAYER_ID);
  if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
  reportStatus("idle");
}

/**
 * Re-add the layers after a base-style change (setStyle wipes custom
 * sources/layers). Reuses the most recently fetched data so the overlay
 * reappears instantly, then triggers a background refresh.
 */
export function reapplyWeatherWarnings(map) {
  if (!enabled) return;
  addSourceAndLayers(map);
  bindInteractions(map);
  const source = map.getSource(SOURCE_ID);
  if (source) source.setData(lastData);
  reportStatus("ready", { count: lastData.features.length });
  refresh(map);
}
