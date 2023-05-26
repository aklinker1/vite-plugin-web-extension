---
lang: en-US
title: Integrating Frontend Frameworks
---

# Integrating Frontend Frameworks

Using frontend frameworks such as Vue, React, or Svelte in your extension is straightforward. You only need to include the framework's plugin in your `vite.config.ts` file.

The plugin supports all frontend frameworks that have a Vite plugin. The following are examples of how to incorporate a few popular frameworks:

[[toc]]

## Vue Integration

To integrate Vue into your extension, add the Vue plugin to your `vite.config.ts` file:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import webExtension from "vite-plugin-web-extension";
import vue from "@vite/plugin-vue";

export default defineConfig({
  plugins: [
    vue(),
    webExtension({
      // ...
    }),
  ],
});
```

## React Integration

To integrate React into your extension, include the React plugin in your `vite.config.ts` file:

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

## React (SWC) Integration

If you prefer to use the SWC version of the React plugin, you can include it in your `vite.config.ts` file like so:

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

## Svelte Integration

To integrate Svelte into your extension, include the Svelte plugin in your `vite.config.ts` file:

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
