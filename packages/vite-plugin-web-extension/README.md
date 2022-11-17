<h1 align="center">Vite Plugin Web Extension</h1>

A simple but powerful Vite plugin for developing browser extensions

```bash
npm i -D vite-plugin-web-extension
```

```ts
// vite.config.ts
import browserExtension from "vite-plugin-web-extension";

export default defineConfig({
  plugins: [
    browserExtension({
      manifest: "manifest.json",
      assets: "assets",
    }),
  ],
});
```

Head over to the [docs](https://v1.vite-plugin-web-extension.aklinker1.io/) to get started.
