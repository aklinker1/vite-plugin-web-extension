import path from "path";
import { defineConfig } from "vite";
import browserExtension from "vite-plugin-web-extension";

export default defineConfig({
  root: "src",
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
  plugins: [
    browserExtension({
      manifest: () => require("./src/manifest.json"),
      assets: "assets",
      additionalInputs: ["content-scripts/script1/index.ts"],
    }),
  ],
});
