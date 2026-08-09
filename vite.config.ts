import { defineConfig } from "vite";

const workerOrigin = "http://127.0.0.1:8787";

export default defineConfig({
  root: "frontend",
  publicDir: "public",
  server: {
    port: 5173,
    proxy: {
      "/documents": workerOrigin,
      "/raw": workerOrigin,
      "/html": workerOrigin,
      "/solarized.css": workerOrigin,
      "/solarized-light.css": workerOrigin,
    },
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
