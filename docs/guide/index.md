---
lang: en-US
title: Getting Started
---

# Getting Started

## Introduction

`vite-plugin-web-extension` allows you to construct a complete Chrome extension by providing a single plugin to your build configuration.

```ts
import webExtension from "vite-plugin-web-extension";

export default defineConfig({
  plugins: [webExtension()],
});
```

::: info
This plugin is fully compatible with all other Vite plugins. You can include them in the list of plugins in any order you prefer.
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

After the initialization, you can run `pnpm dev` to open a browser and install the extension in development mode, or `pnpm build` to bundle your extension for production.

## Setting Up a Project Manually

If you prefer, you can also set up your project manually. Follow these steps:

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

3. Create a `manifest.json` and your entry points:

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

4. Create a `vite.config.ts`, adding the plugin:

   ```ts
   // vite.config.ts
   import { defineConfig } from "vite";
   import webExtension from "vite-plugin-web-extension";

   export default defineConfig({
     plugins: [webExtension()],
   });
   ```

That's it! You're ready to go. Run `pnpm dev` to open a browser and install the extension in development mode, or `pnpm build` to bundle your extension for production.
