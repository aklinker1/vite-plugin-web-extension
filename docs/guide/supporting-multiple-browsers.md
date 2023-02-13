---
lang: en-US
title: Support Multiple Browsers
---

# Support Multiple Browsers

## Overview

`vite-plugin-web-extension` doesn't have any special logic for supporting multiple browsers **_at runtime_**. Instead, at build-time, it provides a way to create multiple versions of your extension depending on which browser you're targetting.

:::info
For standardizing the behavior of multiple browsers at runtime, consider using [`webextension-polyfill`](https://www.npmjs.com/package/webextension-polyfill). It standardized the `chrome` and `browser` APIs used by Chrome and Firefox, into a single API.

To use with `vite-plugin-web-extension`, just import the polyfill wherever you need to use an extension API.

```ts
// Works on Chrome, Edge, Firefox, Safari... every browser
import browser from "webextension-polyfill";

browser.runtime.getURL("/popup.html");
```

:::

## Manifest Template

A common pattern is to support both Chrome and Firefox for an extension. However, Chrome pretty much requires you to use MV3 at this point, which firefox doesn't support MV3 in production yet.

It's very simple to setup a manifest template that contains certain fields for each target.

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

Here, we're telling the plugin to set the manifest_version to 3 for chrome, and 2 for firefox. Same with the `action` field and the `browser_action` field. Those are only available on for MV3 and MV2 respectively, so we add the `{{browser}}.` prefix to specify which fields should be used for each browser.

To tell the plugin which browser to use, set the `browser` option to one of the values from the template:

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

Then, when you run `TARGET=chrome vite build` or `TARGET=firefox vite build`, you'll end up with two different versions of the manifest:

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

## Dynamic Manifest

You can also set the plugin's [`manifest` option](/config/plugin-options#manifest) to a function, and generate your manifest from code. Or use it in combination with the manifest template above to sync the manifest's `version` field with your `package.json`'s `version` field:

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
        // Use `readJsonFile` instead of import/require so it's not cached on rebuild.
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

You can do anything you want when you set the `manifest` option to a function!

## Multiple Files

If you don't like having different browser's manifests in a single file, you could use the `manifest` option to specify different files for each browser:

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
