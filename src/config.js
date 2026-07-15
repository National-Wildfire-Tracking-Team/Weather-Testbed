// Weather Testbed configuration
//
// The Mapbox access token must be a PUBLIC token (starts with "pk.") since it
// is used from the browser. Manage tokens at
// https://account.mapbox.com/access-tokens/
//
// Prefer supplying the token through the build environment:
//
//   VITE_MAPBOX_TOKEN=pk.your_token   (see .env / .env.local)
//
// The hard-coded value below is only a fallback so the site keeps working out
// of the box for testing. You can restrict a public token by URL in the Mapbox
// dashboard to limit where it may be used. Never commit a secret token ("sk.").
const FALLBACK_TOKEN =
  "pk.eyJ1Ijoia2Jlc2hvcmU2IiwiYSI6ImNtaG1kN3NvMjA5eTEyaW9nNG9uMjdqcWUifQ.JywdBqHqT3tcQ8IbyljLjg";

export const CONFIG = {
  MAPBOX_TOKEN: (import.meta.env.VITE_MAPBOX_TOKEN || FALLBACK_TOKEN).trim(),

  // Initial map view.
  INITIAL_CENTER: [-98.35, 39.5], // [longitude, latitude] — continental US
  INITIAL_ZOOM: 3.5,

  // Default map style (must match one of the <option> values in index.html).
  DEFAULT_STYLE: "mapbox://styles/mapbox/outdoors-v12",
};
