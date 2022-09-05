---
lang: en-US
title: Installation
description: Setup your project to use vite-plugin-web-extension
---

# Installation

<CodeGroup>
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
  <CodeGroupItem title="PNPM">

```bash:no-line-numbers
pnpm i -D vite-plugin-web-extension
```

  </CodeGroupItem>
</CodeGroup>

<!--## Scaffold Your Project

<CodeGroup>
  <CodeGroupItem title="NPM" active>

```bash:no-line-numbers
npm create vite-plugin-web-extension@latest
```

  </CodeGroupItem>
  <CodeGroupItem title="YARN">

```bash:no-line-numbers
yarn create vite-plugin-web-extension
```

  </CodeGroupItem>
  <CodeGroupItem title="PNPM">

```bash:no-line-numbers
pnpm create vite-plugin-web-extension
```

  </CodeGroupItem>
</CodeGroup>

Then follow the prompts! There are several variations of projects you can start with: TS, Vue, React, etc.-->

## Manual Project Setup

Lets say your project looks like this:

<pre>
<strong>dist/</strong>
   <i>build output...</i>
<strong>src/</strong>
   <strong>assets/</strong>
      <i>icon-16.png</i>
      <i>icon-48.png</i>
      <i>icon-128.png</i>
   <strong>background/</strong>
      <i>index.ts</i>
   <strong>popup/</strong>
      <i>index.html</i>
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
  root: "src",
  // Configure our outputs - nothing special, this is normal vite config
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
  // Add the webExtension plugin
  plugins: [
    webExtension({
      manifest: path.resolve(__dirname, "src/manifest.json"),
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
    "default_popup": "popup/index.html"
  },
  "background": {
    // Relative to "src", using real .ts file extension
    "scripts": "background/index.ts"
  }
}
```

And there you go!

Run `vite build` and you should see a fully compiled and working browser extension in your `dist/` directory!
