---
lang: en-US
title: Frontend Frameworks
---

# Frontend Frameworks

To use a framework like Vue, React, or Svelte throughout your extension, simply include the framework's plugin in your `vite.config.ts` just like normal.

:::warning Content Scripts
Depending on the framework, like [Vue](#vue), additional configuration may be needed to use your framework in content scripts, otherwise the content script may not run in dev mode.

Please open an issue if your framework does not work in dev mode.
:::

All frameworks with a Vite plugin are supported. Here are a few examples:

[[toc]]

## Vue

```ts
// vite.config.ts
import { defineConfig } from "vite";
import webExtension from "vite-plugin-web-extension";
import vue from "@vite/plugin-vue";

export default defineConfig({
  plugins: [
    vue(),
    webExtension({
      // Optionally, to use Vue in content scripts, add the following:
      scriptViteConfig: {
        plugins: [vue()],
      },
    }),
  ],
});
```

## React

```ts
// vite.config.ts
import { defineConfig } from "vite";
import webExtension from "vite-plugin-web-extension";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      // ...
    }),
  ],
});
```

## React (SWC)

```ts
// vite.config.ts
import { defineConfig } from "vite";
import webExtension from "vite-plugin-web-extension";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      // ...
    }),
  ],
});
```

## Svelte

```ts
// vite.config.ts
import { defineConfig } from "vite";
import webExtension from "vite-plugin-web-extension";
import svelte from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [
    svelte(),
    webExtension({
      // ...
    }),
  ],
});
```
