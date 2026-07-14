// Weather Testbed configuration
//
// Mapbox access token. This must be a PUBLIC token (starts with "pk.") since it
// is used from the browser. Get or manage tokens at
// https://account.mapbox.com/access-tokens/
//
// You can restrict a public token by URL in the Mapbox dashboard to limit where
// it may be used.
window.CONFIG = {
  MAPBOX_TOKEN:
    "pk.eyJ1Ijoia2Jlc2hvcmU2IiwiYSI6ImNtaG1kN3NvMjA5eTEyaW9nNG9uMjdqcWUifQ.JywdBqHqT3tcQ8IbyljLjg",

  // Initial map view.
  INITIAL_CENTER: [-98.35, 39.5], // [longitude, latitude] — continental US
  INITIAL_ZOOM: 3.5,

  // Default map style (must match one of the <option> values in index.html).
  DEFAULT_STYLE: "mapbox://styles/mapbox/outdoors-v12",
};
