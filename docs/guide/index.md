---
lang: en-US
title: Installation
---

# Installation

## Overview

`vite-plugin-web-extension` will build an entire chrome extension by adding a single plugin to your build config.

```ts
import webExtension from "vite-plugin-web-extension";

export default defineConfig({
  plugins: [webExtension()],
});
```

::: info
This plugin is compatible with all other Vite plugins. Just add them to the list of plugins in any order.
:::

## Create a New Project

To get started, bootstrap a project using one of the templates:

::: code-group

```bash [PNPM]
pnpm create vite-plugin-web-extension
```

```bash [YARN]
yarn create vite-plugin-web-extension
```

```bash [NPM]
npm create vite-plugin-web-extension
```

:::

::: details Templates

There are several starter templates to choose from:

|  Javascript  |  Typescript  |
| :----------: | :----------: |
| `vanilla-js` | `vanilla-ts` |
|   `vue-js`   |   `vue-ts`   |
|  `react-js`  |  `react-ts`  |
| `svelte-js`  | `svelte-ts`  |

:::

Then run `pnpm dev` to open a browser and install the extension in dev mode, or `pnpm build` to build your extension for production.

## Manual Project Setup

Alternatively, here's how to create a project from scratch.

1. Create a `package.json`:

   ```json
   {
     "name": "Example Extension",
     "type": "module",
     "scripts": {
       "dev": "vite dev",
       "build": "vite build"
     }
   }
   ```

2. Install Vite, the plugin, and other dependencies:

   ```bash
   pnpm i vite vite-plugin-web-extension
   pnpm i webextension-polyfill
   ```

3. Create a `manifest.json` and your entrypoints:

   ```json
   // manifest.json
   {
     "name": "Example Extension",
     "version": "1.0.0",
     "manifest_version": 3,
     "background": {
       "service_worker": "src/background.ts"
     },
     "options_page": "src/options.html"
   }
   ```

   ```ts
   // src/background.ts
   import browser from "webextension-polyfill";

   browser.runtime.onInstalled.addListener(() => {
     console.log("Installed!");
   });
   ```

   ```html
   <!-- src/options.html -->
   <!DOCTYPE html>
   <html lang="en">
     <head>
       <meta charset="UTF-8" />
       <meta http-equiv="X-UA-Compatible" content="IE=edge" />
       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
       <title>Project Name</title>
     </head>
     <body>
       Hello world!
     </body>
   </html>
   ```

4. Create your Vite config, adding the plugin:

   ```ts
   // vite.config.ts
   import { defineConfig } from "vite";
   import webExtension from "vite-plugin-web-extension";

   export default defineConfig({
     plugins: [webExtension()],
   });
   ```

And you're all set! Run `pnpm dev` to open a browser and install the extension in dev mode, or `pnpm build` to build your extension for production.
