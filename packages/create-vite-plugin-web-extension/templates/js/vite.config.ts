import { defineConfig } from "vite";
import webExtension, { readJsonFile } from "vite-plugin-web-extension";

function loadWebExtConfig() {
  try {
    return require("./.web-ext.config.json");
  } catch {
    return undefined;
  }
}

function generateManifest() {
  const manifest = readJsonFile("manifest.json");
  const pkg = readJsonFile("package.json");
  return {
    name: pkg.name,
    description: pkg.description,
    version: pkg.version,
    ...manifest,
  };
}

export default defineConfig({
  plugins: [
    webExtension({
      assets: "public",
      webExtConfig: loadWebExtConfig(),
      manifest: generateManifest,
    }),
  ],
});
