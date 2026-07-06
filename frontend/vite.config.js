import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxies /api requests to the FastAPI backend during local development,
// so the frontend can simply call fetch("/api/...") with no CORS friction.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
