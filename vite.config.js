import { defineConfig } from "vite";

// Relative base so the built site works no matter where it is served from:
// the repository root on Netlify (`/`) as well as a project subpath on
// GitHub Pages (`/Weather-Testbed/`). Absolute asset URLs would break the
// GitHub Pages subpath, so we emit relative URLs instead.
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    sourcemap: true,
    // mapbox-gl is a large single dependency (~1.8 MB); the default 500 kB
    // warning is expected and not actionable here.
    chunkSizeWarningLimit: 2000,
  },
});
