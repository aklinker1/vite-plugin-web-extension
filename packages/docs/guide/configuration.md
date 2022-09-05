---
lang: en-US
title: Configuration
---

# Configuration

## Dev Mode

```bash
vite dev
```

will open a browser and install your extension.

When you change a file, it will either hot-reload (if the file was associated with an HTML entry point) or rebuilt and reload the entire extension (if the file is used by background/content scripts) so you get the latest code immediately.

> Only supported for Manifest V2 builds due to a bug: https://bugs.chromium.org/p/chromium/issues/detail?id=1290188
>
> Use [Watch Mode](#watch-mode) for MV3 instead

Dev mode works best when you're using a front-end framework, and making changes to a UI like the popup or options page.

HMR will not be used when making changes to UI injected by content scripts.

Set `disableAutoLaunch` to `true` to skip the automatic installation of the extension.

## Watch Mode

Watch mode differs from dev mode because it will rebuild and reload the entire extension on every file change (no HMR)

It will also result in the exact same code as `vite build`, whereas dev mode modifies your HTML files to enable HMR.

To run in watch mode, use the `--watch` flag.

```bash
vite build --watch
```

To reload when you update files other than source files (config files like `tailwind.config.js`) pass the `watchFilePaths` option. Use **absolute paths** for this option:

```ts
import path from "path";

export default defineConfig({
  ...
  plugins: [
    webExtension({
      watchFilePaths: [
        path.resolve(__dirname, "tailwind.config.js")
      ],
      disableAutoLaunch: false // default is false
    }),
  ],
});
```

> Watch mode will not reload properly when the manifest changes. You'll need to restart the `vite build --watch` command use the updated manifest.
>
> This is a limitation of [`web-ext`](https://www.npmjs.com/package/web-ext)

Set `disableAutoLaunch` to `true` to skip the automatic installation of the extension.

## Front-end Frameworks

If you want to add a framework like Vue or React, just add their Vite plugin!

```ts
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  ...
  plugins: [
    vue(),
    webExtension({ ... }),
  ],
});
```

You can now use the framework anywhere! In your popup, options page, content scripts, etc.

See `demos/vue` for a full example.

## Browser Startup

This plugin uses `web-ext` under the hood to startup a browser and install the extension in dev mode. You can configure `web-ext` via the `webExtConfig` option.

For a list of options, you'll have to look at [`web-ext`'s source code](https://github.com/mozilla/web-ext/blob/666886f40a967b515d43cf38fc9aec67ad744d89/src/program.js#L559), and search for `.command('run'`, then camelCase each flag. If it's type is `array`, set it equal to an array of the values.

Here are some examples (with their CLI equivalents above):

```ts
webExtension({
  webExtConfig: {
    // --chromium-binary /path/to/google-chrome
    chromiumBinary: "/path/to/google-chrome",
    // --start-url google.com --start-url duckduckgo.com
    startUrl: ["google.com", "duckduckgo.com"],
    // --watch-ignored *.md *.log
    watchIgnored: ["*.md", "*.log"],
  },
});
```

See [#22](https://github.com/aklinker1/vite-plugin-web-extension/issues/22) for a real use case of changing the startup chrome window size.

## Dynamic Manifests

The `manifest` option also accepts a function. This function should return a javascript object containing the same thing as `manifest.json`. It should include real file paths, as well as any browser specific flags (see next section).

Often times this is used to pull in details from your `package.json` like the version so they only have to be maintained in a single place

```ts
import webExtension from "vite-plugin-web-extension";

export default defineConfig({
  plugins: [
    webExtension({
      manifest: () => {
        // Generate your manifest
        const packageJson = require("./package.json");
        return {
          ...require("./manifest.json"),
          name: packageJson.name,
          version: packageJson.version,
        };
      },
      assets: "assets",
    }),
  ],
});
```

### Browser Specific Manifest Fields

Either the file or object returned by the `manifest` option can include flags that specify certain fields for certain browsers, and the plugin will strip out any values that aren't for a specific browser

Here's an example: Firefox doesn't support manifest V3 yet, but chrome does!

```jsonc
{
  "{{chrome}}.manifest_version": 3,
  "{{firefox}}.manifest_version": 2,
  "{{chrome}}.action": {
    "default_popup": "index.html"
  },
  "{{firefox}}.browser_action": {
    "default_popup": "index.html",
    "browser_style": false
  },
  "options_page": "options.html",
  "permissions": ["activeTab", "{{firefox}}.<all_urls>"]
}
```

To build for a specific browser, simply pass the `browser` option and prefix any **field name** or **string value** with `{{browser-name}}.`. This is not limited to just `chrome` and `firefox`, you can use any string inside the double curly braces as long as your pass it into the plugin's `browser` option.

You can pass this option in a multitude of ways. Here's one way via environment variables!

```bash
# In package.json or via CLI
cross-env TARGET_BROWSER=chrome vite build
```

```ts
export default defineConfig({
  plugins: [
    webExtension({
      manifest: "manifest.json",
      assets: "assets",
      browser: process.env.TARGET_BROWSER,
    }),
  ],
});
```

## Additional Inputs

If you have have HTML or JS files that need to be built, but aren't listed in your `manifest.json`, you can add them via the `additionalInputs` option.

The paths should be relative to the Vite's `root`, just like the `assets` option.

```ts
export default defineConfig({
  plugins: [
    webExtension({
      ...
      additionalInputs: [
        "onboarding/index.html",
        "content-scripts/injected-from-background.ts",
      ]
    }),
  ],
});
```

> HTML pages are built alongside the popup and options page in multi-page mode, whereas all other files are built as standalone bundles.

## CSS

For HTML entry points like the popup or options page, css is automatically output and referenced in the built HTML. There's nothing you need to do!

### Content Scripts

For content scripts listed in your `manifest.json`, it's a little more difficult. There are two ways to include CSS files:

1. You have a CSS file in your project
1. The stylesheet is generated by a framework like Vue or React or is imported by the code

For the first case, it's simple! Make sure you have the relevant plugin installed to parse your stylesheet (like scss), then list the file in your `manifest.json`. The plugin will look at the `css` array and output all inputs as plain CSS.

```json
{
  "content_scripts": [
    {
      "matches": [...],
      "css": ["content-scripts/some-style.scss"]
    }
  ]
}
```

For the second case, it's a little more involved. Say your content script is at `content-scripts/overlay.ts` and is responsible for binding a Vue/React app to a webpage. When Vite compiles it, it will output two files: `dist/content-scripts/overlay.js` and `dist/content-scripts/overlay.css`. Check what is output, then update your manifest to point towards the output files, prefixed with `generated:`.

```json
{
  "content_scripts": [
    {
      "matches": [...],
      "scripts": "content-scripts/overlay.ts",
      "css": ["generated:content-scripts/overlay.css"]
    }
  ]
}
```

This will tell the plugin that the file is already being generated for us, but that we still need it in the final manifest.

### Browser API `tabs.executeScripts`

For content scripts injected programmatically, include the script's path in the plugin's [`additionalInputs` option](#additional-inputs).

## Manifest Validation

Whenever your manifest is generated, it gets validated against Google's JSON schema: <https://json.schemastore.org/chrome-manifest>.

To disable validation, pass the `skipManifestValidation` option:

```ts
export default defineConfig({
  plugins: [
    webExtension({
      skipManifestValidation: true,
    }),
  ],
});
```

## Per-build Customization

<!--### Multi-page Builds

By default, `vite-plugin-web-extension` will automatically configure sets of HTML input files to be built in [multi-page mode](https://vitejs.dev/guide/build.html#multi-page-app).

To customize these builds, you can provide `options.multiPageModeViteConfig`-->

### Lib-mode Builds

By default, `vite-plugin-web-extension` will automatically configure vite's build config when building scripts in lib mode (background, content scripts, additional inputs, etc).

If that config is does not work for your case, you can modify it via `libModeViteConfig`.

For example, if a script requires dynamic imports, they need to be added inline because UMD doesn't support code-splitting:

```ts
import { defineConfig } from "vite";
import webExtension from "vite-plugin-web-extension";

const libModeViteConfig = defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Disable code splitting and put dynamic imports inline
        inlineDynamicImports: true,
      },
    },
  },
});

export default defineConfig({
  plugins: [
    webExtension({
      // ...
      libModeViteConfig,
    }),
  ],
});
```
