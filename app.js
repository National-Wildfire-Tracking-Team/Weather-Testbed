(function () {
  "use strict";

  var config = window.CONFIG || {};
  var token = (config.MAPBOX_TOKEN || "").trim();
  var center = config.INITIAL_CENTER || [-98.35, 39.5];
  var zoom = config.INITIAL_ZOOM || 3.5;
  var style = config.DEFAULT_STYLE || "mapbox://styles/mapbox/outdoors-v12";

  var warning = document.getElementById("token-warning");
  var coordsDisplay = document.getElementById("coords-display");

  if (!token || token.indexOf("pk.") !== 0) {
    if (warning) warning.hidden = false;
    return;
  }

  mapboxgl.accessToken = token;

  var map = new mapboxgl.Map({
    container: "map",
    style: style,
    center: center,
    zoom: zoom,
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

  var marker = null;

  map.on("click", function (e) {
    var lng = e.lngLat.lng.toFixed(4);
    var lat = e.lngLat.lat.toFixed(4);

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

  var styleSelect = document.getElementById("style-select");
  if (styleSelect) {
    styleSelect.value = style;
    styleSelect.addEventListener("change", function () {
      map.setStyle(styleSelect.value);
    });
  }
})();
