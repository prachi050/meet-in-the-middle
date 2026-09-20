import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" keeps asset paths relative, so the built site works on Vercel, Netlify, GitHub Pages, or any static host.
export default defineConfig({
  base: "./",
  plugins: [react()],
});
