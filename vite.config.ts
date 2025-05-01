import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cloudflare(), tailwindcss(), sqlPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

// Custom Vite plugin to handle SQL files
// This is for drizzle ORM
// becouse normale you would to it with rules in wrangler.jsonc
// but vite does not support rules

function sqlPlugin() {
  return {
    name: "vite-plugin-sql",
    transform(content: string, id: string) {
      if (id.endsWith(".sql")) {
        return {
          code: `export default ${JSON.stringify(content)};`,
          map: null,
        };
      }
    },
  };
}
