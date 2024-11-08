---
lang: en-US
title: Plugin Configuration Options
---

# Plugin Configuration Options

```ts
import { defineConfig } from "vite";
import webExtension from "vite-plugin-web-extension";

export default defineConfig({
  plugins: [
    webExtension({
      // place options here
    }),
  ],
});
```

## `additionalInputs`

```ts
additionalInputs?: string[]
```

An array of paths relative to Vite's root directory that should be built along with the inputs listed in your manifest.

This generally involves additional HTML files not listed in your manifest but which you still want to display, such as an onboarding page. It also accepts stylesheets (CSS, SCSS, Stylus, etc.) and scripts (JS or TS) - basically, anything that Vite can build.

Depending on the type of file provided, it will be built at different stages:

- HTML files are built in the same step alongside the other HTML files listed in the manifest.
- JS files are bundled individually in the order specified.
- CSS files are also bundled individually in the order given.

## `browser`

```ts
browser?: string
```

<script setup>
const browser = "{{browser}}"
</script>

When using <code>{{browser}}.</code> prefixes in your manifest template, defining this field ensures that only matching tags are included in the `<outDir>/manifest.json`.

Refer to [Multibrowser Support](/guide/supporting-multiple-browsers) for more details on how to use this option with manifest templates.

## `disableAutoLaunch`

```ts
disableAutoLaunch?: boolean;
```

Setting this to `true` prevents the browser from launching when starting the development server or running the extension in watch mode.

This is useful in setups where opening the browser isn't possible, such as in WSL/WSL2. In these scenarios, the Linux shell can't communicate with the Windows browser, leading to crashes. Setting `disableAutoLaunch: true` will trigger rebuilds when you save a file, and you can manually open and install the extension.

## `htmlViteConfig`

```ts
htmlViteConfig?: import('vite').InlineConfig
```

You can supply additional Vite configuration to the HTML multipage build step here.

::: warning
Exercise caution with this option. Not every one of Vite's build options have been tested for compatibility. If something doesn't work for you, please open an issue.
:::

## `manifest`

```ts
manifest?: string | (() => any) | (() => Promise<any>)
```

The manifest can be:

- A path relative to Vite's root directory pointing to a file containing a manifest template.
- An absolute path pointing to a file containing a manifest template.
- A function returning the manifest template as a JSON object.

When not provided, it defaults to `"manifest.json"`, and the plugin searches for a template at `<viteRoot>/manifest.json`.

Refer to [Multibrowser Support](/guide/supporting-multiple-browsers) for more information on how to use manifest templates.

## `printSummary`

```ts
printSummary?: boolean
```

Defaults to `true`. When set to `true`, the plugin will provide a summary of what files are being built and in what order.

## `scriptViteConfig`

```ts
scriptViteConfig?: import('vite').InlineConfig
```

You can provide additional Vite config to individually bundled JS files here.

::: warning
Exercise caution with this option. Not every one of Vite's build options have been tested for compatibility. If something doesn't work for you, please open an issue.
:::

## `skipManifestValidation`

```ts
skipManifestValidation?: boolean
```

By default, the `<outDir>/manifest.json` undergoes validation against Google's JSON schema at <https://json.schemastore.org/chrome-manifest>.

Setting this to `true` skips the validation step.

> The validation process downloads the schema from the given URL. If you are working offline, this step will automatically be skipped.

## `transformManifest`

Since [v3.1.0](https://github.com/aklinker1/vite-plugin-web-extension/releases/tag/v3.1.0)

```ts
transformManifest?: (manifest: WebExtensionManifest) => WebExtensionManifest | Promise<WebExtensionManifest>
```

A hook that lets you manipulate the manifest before it is written to the output directory by returning a new manifest.

### Example

Here, `transformManifest` is used to remove all the CSS files from the content scripts.

```ts
webExtension({
  transformManifest(manifest) {
    manifest.content_scripts.forEach((script) => {
      delete script.css;
    });
    return manifest;
  },
});
```

## `watchFilePaths`

```ts
watchFilePaths?: string[]
```

An array of paths relative to Vite's root directory that triggers a complete rebuild of the extension during development. When one of these files is saved, the browser will be closed, the manifest regenerated, and the browser will relaunch.

If the [`manifest` field](#manifest) was a string, it will be automatically added to this list. If the [`manifest` field](#manifest) is a function, you should add any files used to generate the manifest (like package.json).

## `webExtConfig`

```ts
webExtConfig?: any
```

This option allows you to pass configuration into `web-ext` when launching the browser. For more details, refer to [Browser Startup Configuration](/guide/configure-browser-startup.md).

## `bundleInfoJsonPath`

```ts
bundleInfoJsonPath?: string
```

If set, the plugin will write a JSON file containing information about the built bundles to the specified path in the output directory. This can for example be useful for dynamically injecting content scripts/styles from background scripts.

## `onBundleReady`

```ts
onBundleReady?: () => void | Promise<void>
```

This callback is invoked after the main (parent) build completes, but not for child builds triggered by different entry points. Use it to perform additional actions when the main extension bundle is ready in both development (serve) and production (build) modes.
