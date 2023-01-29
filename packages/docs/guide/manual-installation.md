---
lang: en-US
title: Manual Project Setup
description: Setup your project to use vite-plugin-web-extension
---

# Manual Project Setup

<CodeGroup>
  <CodeGroupItem title="PNPM" active>

```bash:no-line-numbers
pnpm i -D vite-plugin-web-extension
```

  </CodeGroupItem>
  <CodeGroupItem title="NPM">

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
   <strong>public/</strong>
      <i>icon-16.png</i>
      <i>icon-48.png</i>
      <i>icon-128.png</i>
   <i>background.ts</i>
   <i>popup.html</i>
   <i>manifest.json</i>
<i>package.json</i>
<i>vite.config.ts</i>
</pre>

Configuring Vite is simple:

```ts:no-line-numbers
// vite.config.ts
import webExtension from "vite-plugin-web-extension";
import path from "node:path";

export default defineConfig({
  // Setting the root to src will remove the `src` directory from the output paths (`dist/popup.html` instead of `dist/src/popup.html`).
  // This effects the final URL pages and files are accessible from.
  root: "src",
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  }
  // Add the webExtension plugin
  plugins: [webExtension()],
});
```

> You don't need to specify a `root` if you don't want to.

By default, `vite-plugin-web-extension` will look for `<root>/manifest.json`.

In your `manifest.json`, all paths should also be relative to your Vite `root`, and point to the source code files.

```json:no-line-numbers
// src/manifest.json
{
  "name": "Example",
  "version": "1.0.0",
  "manifest_version": "2",
  "icons": {
    "16": "icon-16.png",
    "48": "icon-48.png",
    "128": "icon-128.png"
  },
  "browser_action": {
    "default_icon": "icon-128.png",
    "default_popup": "popup.html"
  },
  "background": {
    "scripts": "background.ts"
  }
}
```

> Files in `public/` directory don't need to be relative to Vite's root. See [Vite's docs](https://vitejs.dev/guide/assets.html#the-public-directory) for more details.

And we're done! Run `vite build` and you should see a fully compiled and working browser extension in your `dist/` directory!
