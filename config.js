// Weather Testbed configuration
//
// The map itself (Leaflet + OpenStreetMap) works with no API key.
// To enable the weather overlay layers (clouds, precipitation, temperature,
// wind) get a free API key from https://openweathermap.org/api and paste it
// below.
//
// NOTE: This key is exposed to the browser, so only use a key that is safe for
// public/client-side use (as OpenWeatherMap keys for tile layers are).
window.CONFIG = {
  // Replace with your OpenWeatherMap API key, e.g. "abc123def456..."
  OPENWEATHER_API_KEY: "",

  // Initial map view: [latitude, longitude] and zoom level.
  // Defaults to the continental United States (wildfire tracking context).
  INITIAL_CENTER: [39.5, -98.35],
  INITIAL_ZOOM: 4,
};
