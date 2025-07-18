import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  server: {
    watch: {
      usePolling: true,
      interval: 1000,
    },
    host: true,
    port: 5173,
    hmr: {
      port: 5173,
    },
  },
});
