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
      manifest: path.resolve(__dirname, "manifest.json"),
      assets: "assets",
    }),
  ],
});
```

Head over to [GitHub](https://github.com/aklinker1/vite-plugin-web-extension/blob/main/README.md) to see the full docs and advanced options
