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
}
