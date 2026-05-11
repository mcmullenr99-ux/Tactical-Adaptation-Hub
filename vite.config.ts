import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  define: { '__BUILD_FORCE__': '1776100596' },
  base: "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@workspace/object-storage-web": path.resolve(__dirname, "src/stubs/object-storage-web.ts"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: __dirname,
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        externalLiveBindings: false,
        freeze: false,
        manualChunks(id) {
          // Isolate the giant MilsimManage in its own chunk to prevent TDZ
          if (id.includes("MilsimManage")) {
            return "milsim-manage";
          }
          // Vendor chunk for react + core libs
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "react-vendor";
          }
        },
      }
    }
  },
});
