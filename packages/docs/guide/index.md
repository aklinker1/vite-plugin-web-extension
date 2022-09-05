---
lang: en-US
title: Introduction
---

# Introduction

`vite-plugin-web-extension` lets you get started making Chrome extensions with just a manifest.json and a simple Vite build config:

```ts
// vite.config.ts
import webExtension from "vite-plugin-web-extension";

export default defineConfig({
  plugins: [
    webExtension({
      manifest: "manifest.json",
      assets: "assets",
    }),
  ],
});
```

## Features

- :wrench: Automatically build inputs from in your `manifest.json`
- :tada: Automatically open a browser and install the extension during development
- :zap: Super fast dev mode that automatically reloads your extension
- :globe_with_meridians: Supports all browsers
- :fire: Frontend frameworks for the popup, options page, _**and content scripts**_!
- :robot: Typescript support out of the box!
- :white_check_mark: Manifest validation

## How does this work?

The build process happens in 2 steps:

1. Bundle all the HTML entry-points as a [multi-page app](https://vitejs.dev/guide/build.html#multi-page-app)
2. Bundle everything else (background scripts/service worker, content scripts, etc) individually in [library mode](https://vitejs.dev/guide/build.html#library-mode)

Scripts have to be bundled individually, separate from each other and the HTML entry-points, because they cannot import additional JS files. Each entry-point needs to have everything it needs inside that one file listed in the final manifest.
