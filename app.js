(function () {
  "use strict";

  var config = window.CONFIG || {};
  var apiKey = (config.OPENWEATHER_API_KEY || "").trim();
  var center = config.INITIAL_CENTER || [39.5, -98.35];
  var zoom = config.INITIAL_ZOOM || 4;

  var map = L.map("map", {
    center: center,
    zoom: zoom,
    worldCopyJump: true,
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  var marker = null;
  var coordsDisplay = document.getElementById("coords-display");

  map.on("click", function (e) {
    var lat = e.latlng.lat.toFixed(4);
    var lng = e.latlng.lng.toFixed(4);

    if (marker) {
      marker.setLatLng(e.latlng);
    } else {
      marker = L.marker(e.latlng).addTo(map);
    }

    marker.bindPopup("Lat: " + lat + "<br>Lng: " + lng).openPopup();
    coordsDisplay.textContent = "Lat: " + lat + ", Lng: " + lng;
  });

  // Weather overlay layers (require an OpenWeatherMap API key).
  var weatherLayers = {};
  var toggles = {
    clouds: { id: "toggle-clouds", layer: "clouds_new" },
    precipitation: { id: "toggle-precipitation", layer: "precipitation_new" },
    temp: { id: "toggle-temp", layer: "temp_new" },
    wind: { id: "toggle-wind", layer: "wind_new" },
  };

  function buildWeatherLayer(layerName) {
    return L.tileLayer(
      "https://tile.openweathermap.org/map/" +
        layerName +
        "/{z}/{x}/{y}.png?appid=" +
        apiKey,
      {
        maxZoom: 19,
        opacity: 0.6,
        attribution:
          '&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>',
      }
    );
  }

  var hasKey = apiKey.length > 0;
  var warning = document.getElementById("api-key-warning");
  if (!hasKey && warning) {
    warning.hidden = false;
  }

  Object.keys(toggles).forEach(function (key) {
    var config = toggles[key];
    var input = document.getElementById(config.id);
    if (!input) return;

    if (!hasKey) {
      input.disabled = true;
      return;
    }

    input.addEventListener("change", function () {
      if (input.checked) {
        if (!weatherLayers[key]) {
          weatherLayers[key] = buildWeatherLayer(config.layer);
        }
        weatherLayers[key].addTo(map);
      } else if (weatherLayers[key]) {
        map.removeLayer(weatherLayers[key]);
      }
    });
  });
})();
