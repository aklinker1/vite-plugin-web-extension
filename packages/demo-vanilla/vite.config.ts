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
      manifest: "manifest.json",
      additionalInputs: [
        "content-scripts/script1/index.ts",
        "another-page/index.html",
      ],
      watchFilePaths: [root("src/manifest.json")],
      browser: process.env.TARGET || "chrome",
      //   scriptViteConfig: {
      //     build: {
      //       rollupOptions: {
      //         output: {
      //           assetFileNames: "script/asset/[name].[ext]",
      //           entryFileNames: "script/entry/[name].js",
      //           chunkFileNames: "script/chunk/[name].js",
      //         },
      //       },
      //     },
      //   },
      //   htmlViteConfig: {
      //     build: {
      //       rollupOptions: {
      //         output: {
      //           assetFileNames: "html/asset/[name].[ext]",
      //           entryFileNames: "html/entry/[name].js",
      //           chunkFileNames: "html/chunk/[name].js",
      //         },
      //       },
      //     },
      //   },
    }),
  ],
});
