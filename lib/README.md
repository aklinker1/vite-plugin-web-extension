# Vite Plugin Web Extension

See the [docs](https://github.com/aklinker1/vite-plugin-web-extension/blob/main/README.md) to get started:

```bash
npm i -D vite-plugin-web-extension
```

```ts
// vite.config.ts
import browserExtension from "vite-plugin-web-extension";

export default defineConfig({
  plugins: [
    browserExtension({
      manifest: () => require("./manifest.json"),
      assets: "assets",
    }),
  ],
});
```
