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
  plugins: [webExtension()],
});
```

## Features

- :wrench: Automatically build inputs from in your `manifest.json`
- :rocket: Open a browser and install the extension during development
- :zap: Super fast dev mode that automatically reloads your extension
- :globe_with_meridians: Supports all browsers
- :fire: Frontend frameworks for the popup, options page, _**and content scripts**_!
- :robot: Typescript support out of the box!
- :white_check_mark: Manifest validation

## How does this work?

1. Read in the manifest
2. Build all entrypoints listed in the `manifest.json` using Vite's JS API
3. Write the final manifest based on the files output from the previous step
4. Open the browser using Mozilla's `web-ext` tool

When the entry points are built, they are grouped together logically to minimize the number of `vite build`s happening in the background.

> The plugin will print each group before they're built so you have a better idea of what it's doing behind the scenes.
