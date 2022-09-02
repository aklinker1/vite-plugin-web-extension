import path from "path";
import { defineConfig } from "vite";
import browserExtension from "vite-plugin-web-extension";
import vue from "@vitejs/plugin-vue";

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
    vue(),
    browserExtension({
      manifest: root("src/manifest.json"),
      assets: "assets",
      browser: process.env.TARGET,
      webExtConfig: {
        firefox: "firefox",
      },
      verbose: true,
    }),
  ],
});
