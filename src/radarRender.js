// Turns a single polar radar sweep (radials × range gates) into a flat RGBA
// image, ready to hand to a Mapbox `image` source. The image is drawn in a
// local azimuthal frame centred on the radar: pixel X maps to metres east,
// pixel Y to metres north, so a pixel's polar coordinate is
// `azimuth = atan2(east, north)` (clockwise from true north) and
// `range = hypot(east, north)`. The caller places the square image on the map
// using geographic corners computed from the same max range (see radar.js), so
// the on-screen result lines up with the ground near the radar.
//
// Rendering is done per output pixel (a reverse mapping) rather than by drawing
// one wedge per gate: for a ~1000² image that is ~1M cheap lookups and avoids
// the moiré / spoke artefacts that per-wedge fills produce.

// Standard NWS reflectivity colour scale, keyed by dBZ. Values below 5 dBZ are
// left transparent so the (very common) clear-air return doesn't wash out the map.
const REF_STOPS = [
  [5, 0x04, 0xe9, 0xe7],
  [10, 0x00, 0x9c, 0xf7],
  [15, 0x03, 0x00, 0xf4],
  [20, 0x02, 0xfd, 0x02],
  [25, 0x01, 0xc5, 0x01],
  [30, 0x00, 0x8e, 0x00],
  [35, 0xfd, 0xf8, 0x02],
  [40, 0xe5, 0xbc, 0x00],
  [45, 0xfd, 0x95, 0x00],
  [50, 0xfd, 0x00, 0x00],
  [55, 0xd4, 0x00, 0x00],
  [60, 0xbc, 0x00, 0x00],
  [65, 0xf8, 0x00, 0xfd],
  [70, 0x98, 0x54, 0xc6],
];

// Legend rows for the reflectivity ramp (used by the UI legend).
export const REF_LEGEND = REF_STOPS.map((s, i) => ({
  label: i === REF_STOPS.length - 1 ? `${s[0]}+` : `${s[0]}–${REF_STOPS[i + 1][0]}`,
  color: `rgb(${s[1]},${s[2]},${s[3]})`,
}));

function refColor(v) {
  if (v == null || v < REF_STOPS[0][0]) return null;
  let c = REF_STOPS[0];
  for (const s of REF_STOPS) {
    if (v >= s[0]) c = s;
    else break;
  }
  return c;
}

// Base velocity. Convention (and the requested colouring): motion *toward* the
// radar is negative and drawn green; motion *away* is positive and drawn red.
// Brightness scales with speed; near-zero is a neutral grey. `vmax` is the
// Nyquist-ish clamp in m/s.
function velColor(v, vmax) {
  if (v == null) return null;
  const t = Math.max(-1, Math.min(1, v / vmax));
  const level = Math.round(40 + 215 * Math.abs(t));
  if (t < -0.02) return [28, level, 28]; // inbound → green (toward station)
  if (t > 0.02) return [level, 28, 28]; // outbound → red (away from station)
  return [110, 110, 110]; // ~zero
}

// Velocity legend rows (green inbound … grey … red outbound).
export const VEL_LEGEND = [
  { label: "Toward (fast)", color: "rgb(28,255,28)" },
  { label: "Toward (slow)", color: "rgb(28,120,28)" },
  { label: "~0", color: "rgb(110,110,110)" },
  { label: "Away (slow)", color: "rgb(120,28,28)" },
  { label: "Away (fast)", color: "rgb(255,28,28)" },
];

// Map every 0.5°-azimuth bin to the index of the radial that best covers it,
// filling gaps so 360-radial (1°-spaced) upper tilts don't leave blank spokes.
function buildAzimuthLUT(azimuths, bins = 720) {
  const lut = new Int16Array(bins).fill(-1);
  for (let i = 0; i < azimuths.length; i++) {
    const b = ((Math.round((azimuths[i] / 360) * bins) % bins) + bins) % bins;
    lut[b] = i;
  }
  let last = -1;
  for (let i = 0; i < bins * 2; i++) {
    const b = i % bins;
    if (lut[b] >= 0) last = lut[b];
    else if (last >= 0) lut[b] = last;
  }
  for (let i = bins * 2 - 1; i >= 0; i--) {
    const b = i % bins;
    if (lut[b] >= 0) last = lut[b];
    else if (last >= 0 && lut[b] < 0) lut[b] = last;
  }
  return lut;
}

/**
 * Render one sweep to RGBA.
 *
 * @param {object}   opts
 * @param {object[]} opts.radials    Per-radial data objects ({ moment_data,
 *                                   gate_count, gate_size, first_gate }).
 * @param {number[]} opts.azimuths   Azimuth (deg) for each radial, same order.
 * @param {"reflectivity"|"velocity"} opts.product
 * @param {number}   opts.maxRangeKm Half-width of the square image, in km.
 * @param {number}   [opts.size]     Image side length in pixels.
 * @param {number}   [opts.vmax]     Velocity clamp (m/s) for the colour ramp.
 * @returns {{ rgba: Uint8ClampedArray, size: number, painted: number }}
 */
export function renderSweep({ radials, azimuths, product, maxRangeKm, size = 1000, vmax = 30 }) {
  const rgba = new Uint8ClampedArray(size * size * 4);
  const lut = buildAzimuthLUT(azimuths);
  const bins = lut.length;
  const colorFn = product === "velocity" ? (v) => velColor(v, vmax) : refColor;
  const alpha = 210;
  let painted = 0;

  for (let y = 0; y < size; y++) {
    const northKm = (1 - ((y + 0.5) / size) * 2) * maxRangeKm;
    for (let x = 0; x < size; x++) {
      const eastKm = (((x + 0.5) / size) * 2 - 1) * maxRangeKm;
      const rangeKm = Math.hypot(eastKm, northKm);
      if (rangeKm > maxRangeKm) continue;

      let az = (Math.atan2(eastKm, northKm) * 180) / Math.PI;
      if (az < 0) az += 360;
      const b = ((Math.round((az / 360) * bins) % bins) + bins) % bins;
      const ri = lut[b];
      if (ri < 0) continue;

      const rad = radials[ri];
      if (!rad) continue;
      const gi = Math.floor((rangeKm - rad.first_gate) / rad.gate_size);
      if (gi < 0 || gi >= rad.gate_count) continue;

      const col = colorFn(rad.moment_data[gi]);
      if (!col) continue;

      const p = (y * size + x) * 4;
      rgba[p] = col[0];
      rgba[p + 1] = col[1];
      rgba[p + 2] = col[2];
      rgba[p + 3] = alpha;
      painted++;
    }
  }
  return { rgba, size, painted };
}
