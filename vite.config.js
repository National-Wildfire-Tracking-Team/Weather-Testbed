import { defineConfig } from "vite";

// Relative base so the built site works no matter where it is served from:
// the repository root on Netlify (`/`) as well as a project subpath on
// GitHub Pages (`/Weather-Testbed/`). Absolute asset URLs would break the
// GitHub Pages subpath, so we emit relative URLs instead.
export default defineConfig({
  base: "./",
  define: {
    // `nexrad-level-2-data` is a CommonJS module written for Node; it (and its
    // `seek-bzip` dependency) references the `global` object, which does not
    // exist in browsers. Alias it to `globalThis`. `Buffer` itself is polyfilled
    // at runtime in src/radar.js via the bundled `buffer` package.
    global: "globalThis",
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    // mapbox-gl is a large single dependency (~1.8 MB); the default 500 kB
    // warning is expected and not actionable here.
    chunkSizeWarningLimit: 2000,
  },
});
