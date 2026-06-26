import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxy /api and /mock-hr to the FastAPI backend during development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:8000", changeOrigin: true },
      "/mock-hr": { target: "http://localhost:8000", changeOrigin: true },
    },
  },
});
