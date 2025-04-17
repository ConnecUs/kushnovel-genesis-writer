
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
// Import the HTML transform plugin
import htmlTransform from "./vite-plugin-html-transform.js";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/kushnovel-genesis-writer/",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    htmlTransform(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
