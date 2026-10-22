import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// The browser calls /api/... and Vite forwards it to the backend on this
// machine, so the app also works from a phone on the same Wi-Fi.
// Set VITE_BACKEND_URL if the API runs elsewhere.
const backend = process.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";
const proxy = { "/api": { target: backend, changeOrigin: true, rewrite: (p: string) => p.replace(/^\/api/, "") } };

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  server: { host: true, port: 5173, strictPort: true, proxy },
  preview: { host: true, port: 4173, proxy },
  build: { outDir: "dist", emptyOutDir: true },
});
