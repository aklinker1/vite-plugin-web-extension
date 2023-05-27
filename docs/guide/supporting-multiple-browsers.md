---
lang: en-US
title: Multibrowser Support
---

# Multibrowser Support

## Introduction

`vite-plugin-web-extension` does not suppport multiple browsers **_at runtime_**. However, at build-time, it allows for the creation of different "flavors" of your extension based on the browser you're targeting.

:::info
For standardizing the behavior of multiple browsers **_at runtime_**, consider using [`webextension-polyfill`](https://www.npmjs.com/package/webextension-polyfill).

To use it with `vite-plugin-web-extension`, simply import the polyfill wherever you need to use an extension API.

```ts
// Works on Chrome, Edge, Firefox, Safari... every browser
import browser from "webextension-polyfill";

browser.runtime.getURL("/popup.html");
```

:::

## Manifest Templates

Often, developers want to support both Chrome and Firefox with their extensions. However, Chrome currently requires the use of MV3, which Firefox does not yet fully support.

You can easily set up a manifest template that includes specific fields for each target browser.

```json
{
  "{{chrome}}.manifest_version": 3,
  "{{firefox}}.manifest_version": 2,
  "name": "Example",
  "version": "1.0.0",
  "description": "Test Vite Plugin Extension with Vue",
  "icons": {
    "16": "icon/16.png",
    "48": "icon/48.png",
    "128": "icon/128.png"
  },
  "{{chrome}}.action": {
    "default_popup": "popup/index.html"
  },
  "{{firefox}}.browser_action": {
    "default_popup": "popup/index.html"
  }
}
```

Here, the plugin will set the `manifest_version` to 3 for Chrome and 2 for Firefox. The same applies to the `action` and the `browser_action` fields. Since they are only available for MV3 and MV2 respectively, we prefix the `{{browser}}.` to specify which fields should be used for each browser.

To tell the plugin which browser to build for, set the [`browser` option](/config/plugin-options#browser) to one of the template's values:

```ts
// vite.config.ts
import defineConfig from "vite";
import webExtension from "vite-plugin-web-extension";

export default defineConfig({
  plugins: [
    webExtension({
      // ...
      browser: process.env.TARGET || "chrome",
    }),
  ],
});
```

Executing `TARGET=chrome vite build` or `TARGET=firefox vite build` will result in two distinct versions of the manifest:

::: code-group

```json [TARGET=chrome]
{
  "manifest_version": 3,
  "name": "Example",
  "version": "1.0.0",
  "description": "Test Vite Plugin Extension with Vue",
  "icons": {
    "16": "icon/16.png",
    "48": "icon/48.png",
    "128": "icon/128.png"
  },
  "action": {
    "default_popup": "popup/index.html"
  }
}
```

```json [TARGET=firefox]
{
  "manifest_version": 2,
  "name": "Example",
  "version": "1.0.0",
  "description": "Test Vite Plugin Extension with Vue",
  "icons": {
    "16": "icon/16.png",
    "48": "icon/48.png",
    "128": "icon/128.png"
  },
  "browser_action": {
    "default_popup": "popup/index.html"
  }
}
```

:::

## Dynamic Manifests

You can also set the plugin's [`manifest` option](/config/plugin-options#manifest) to a function, allowing you to generate your manifest from code. Additionally, you can pair this with the above manifest template to sync the manifest's `version` field with the `version` field in your `package.json`:

```ts
// vite.config.ts
import defineConfig from "vite";
import webExtension, { readJsonFile } from "vite-plugin-web-extension";

const target = process.env.TARGET || "chrome";

export default defineConfig({
  plugins: [
    webExtension({
      // ...
      browser: target,
      manifest: () => {
        // Use `readJsonFile` instead of import/require to avoid caching during rebuild.
        const pkg = readJsonFile("package.json");
        const template = readJsonFile("manifest.json");
        return {
          ...template,
          version: pkg.version,
        };
      },
    }),
  ],
});
```

When the manifest option is set to a function, the possibilities are endless. Customize the manifest however you like.

## Separate Files for Each Browser

If you prefer to maintain separate manifest files for each browser, you can use the [`manifest` option](/config/plugin-options#manifest) to specify different files for each browser:

```ts
// vite.config.ts
import defineConfig from "vite";
import webExtension from "vite-plugin-web-extension";

const target = process.env.TARGET || "chrome";

export default defineConfig({
  plugins: [
    webExtension({
      // ...
      manifest:
        target == "chrome" ? "manifest.chrome.json" : "manifest.firefox.json",
    }),
  ],
});
```
