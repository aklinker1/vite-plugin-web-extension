import path from "path";
import { defineConfig } from "vite";
import browserExtension from "vite-plugin-web-extension";

function root(...paths: string[]): string {
  return path.resolve(__dirname, ...paths);
}

export default defineConfig({
  root: "src",
  build: {
    outDir: root("dist"),
    emptyOutDir: true,
  },
  plugins: [
    browserExtension({
      manifest: root("src/manifest.json"),
      assets: "assets",
      additionalInputs: [
        "content-scripts/script1/index.ts",
        "another-page/index.html",
      ],
      watchFilePaths: [root("src/manifest.json")],
      browser: process.env.TARGET || "chrome",
    }),
  ],
});
