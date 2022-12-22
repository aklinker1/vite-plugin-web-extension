---
lang: en-US
title: Manual Project Setup
description: Setup your project to use vite-plugin-web-extension
---

# Manual Project Setup

<CodeGroup>
  <CodeGroupItem title="PNPM">

```bash:no-line-numbers
pnpm i -D vite-plugin-web-extension
```

  </CodeGroupItem>
  <CodeGroupItem title="NPM" active>

```bash:no-line-numbers
npm install -D vite-plugin-web-extension
```

  </CodeGroupItem>
  <CodeGroupItem title="YARN">

```bash:no-line-numbers
yarn add -D vite-plugin-web-extension
```

  </CodeGroupItem>
</CodeGroup>

Lets say your project looks like this:

<pre>
<strong>dist/</strong>
   <i>build output...</i>
<strong>src/</strong>
   <strong>assets/</strong>
      <i>icon-16.png</i>
      <i>icon-48.png</i>
      <i>icon-128.png</i>
   <i>background.ts</i>
   <i>popup.html</i>
   <i>manifest.json</i>
<i>package.json</i>
<i>vite.config.ts</i>
<i>...</i>
</pre>

Here's the minimal setup required:

```ts
// vite.config.ts
import webExtension from "vite-plugin-web-extension";

export default defineConfig({
  // Setting the root to src will remove the `src` directory from the output paths (`dist/popup.html` instead of `dist/src/popup.html`).
  // This effects the final URL pages and files are accessible from.
  root: "src",
  // When setting the root to a different path, you need to specify the outDir and emptyOutDir to keep the default Vite behavior
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
  // Add the webExtension plugin
  plugins: [
    webExtension({
      manifest: "manifest.json",
      assets: "assets",
    }),
  ],
});
```

> Note that the `assets` option is relative to your Vite `root`. In this case, it's pointing to `src/assets`, not just `assets`.

> You don't need to specify a `root` if you don't want to. When excluded, it defaults to the directory your `vite.config.ts` is in.

For the input `manifest` option, all paths should use their real file extension and the paths should be relative to your vite `root`.

```json
// src/manifest.json
{
  "name": "Example",
  "version": "1.0.0",
  "manifest_version": "2",
  "icons": {
    // Relative to "src"
    "16": "assets/icon-16.png",
    "48": "assets/icon-48.png",
    "128": "assets/icon-128.png"
  },
  "browser_action": {
    "default_icon": "assets/icon-128.png",
    // Relative to "src"
    "default_popup": "popup.html"
  },
  "background": {
    // Relative to "src", using real .ts file extension
    "scripts": "background.ts"
  }
}
```

And there you go!

Run `vite build` and you should see a fully compiled and working browser extension in your `dist/` directory!
