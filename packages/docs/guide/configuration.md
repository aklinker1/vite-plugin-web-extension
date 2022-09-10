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

When you change a file, it will either hot-reload (if the file was associated with an HTML entry point) or rebuilt and reload the entire extension (if the file is used by scripts) so you get the latest code immediately.

> Only supported for Manifest V2 builds due to a bug: https://bugs.chromium.org/p/chromium/issues/detail?id=1290188
>
> Use [Watch Mode](#watch-mode) for MV3 instead

Dev mode works best when you're using a front-end framework, and making changes to a UI like the popup or options page.

HMR will not be used when making changes to UI injected by content scripts.

> Set `disableAutoLaunch` to `true` to skip the automatic installation of the extension.

## Watch Mode

Watch mode differs from dev mode because it will rebuild and reload the entire extension on every file change (no HMR).

It will also result in the exact same code as `vite build`, whereas dev mode modifies your HTML files to enable HMR.

To run in watch mode, use the `--watch` flag.

```bash
vite build --watch
```

To reload when you update files other than source files (config files like `tailwind.config.js`) pass **absolute paths** of the files into `watchFilePaths` option.

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

> Set `disableAutoLaunch` to `true` to skip the automatic installation of the extension.

## Front-end Frameworks

If you want to add a framework like Vue or React, just add it's Vite plugin!

```ts
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  ...
  plugins: [
    vue(),
    webExtension(),
  ],
});
```

You can now use the framework anywhere! In your popup, options page, content scripts, etc.

See [`packages/demo-vue`](https://github.com/aklinker1/vite-plugin-web-extension/tree/main/packages/demo-vue) for an example.

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

See [#22](https://github.com/aklinker1/vite-plugin-web-extension/issues/22) for a real use case of changing the size of Chrome's window on startup.

## Dynamic Manifests

The `manifest` option accepts a file path or a function. 

- The file path should be relative to the Vite `root`
- The function should return a javascript object containing the same thing as `manifest.json`

Often times the function is used to pull in details from your `package.json`, like the version, so they only have to be maintained in a single place:

```ts
import webExtension, { readJsonFile } from "vite-plugin-web-extension";

export default defineConfig({
  plugins: [
    webExtension({
      manifest: () => {
        const packageJson = readJsonFile("./package.json");
        return {
          ...readJsonFile("./manifest.json"),
          version: packageJson.version,
        };
      },
      assets: "assets",
    }),
  ],
});
```

> `readJsonFile` is provided as an alias for `JSON.parse(fs.readFileSync(..., "utf-8"))`

### Browser Specific Manifest Fields

Either the file contents or object returned by the `manifest` option can include flags that specify fields for specific browsers, and the plugin will strip out any values that don't match the browser you're targeting.

Here's a common use case: Firefox doesn't support MV3 yet, but Chrome does!

<CodeGroup>
  <CodeGroupItem title="manifest.json" active>

```json:no-line-numbers
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

  </CodeGroupItem>
  <CodeGroupItem title="browser: chrome">

```json:no-line-numbers
{
  "manifest_version": 3,
  "action": {
    "default_popup": "index.html"
  },
  "options_page": "options.html",
  "permissions": ["activeTab"]
}
```

  </CodeGroupItem>
  <CodeGroupItem title="browser: firefox">

```json:no-line-numbers
{
  "manifest_version": 2,
  "browser_action": {
    "default_popup": "index.html",
    "browser_style": false
  },
  "options_page": "options.html",
  "permissions": ["activeTab", "<all_urls>"]
}
```

  </CodeGroupItem>
</CodeGroup>


To build for a specific browser, pass the `browser` option and prefix any **field name** or **string value** with `{{browser-name}}.`. This is not limited to just `chrome` and `firefox`, you can use any string inside the double curly braces as long as your pass it into the plugin's `browser` option.

You can pass this option in a multitude of ways. Here's one way via environment variables!

```bash:no-line-numbers
# In package.json or via CLI
cross-env TARGET_BROWSER=chrome vite build
```

```ts:no-line-numbers
export default defineConfig({
  plugins: [
    webExtension({
      browser: process.env.TARGET_BROWSER,
    }),
  ],
});
```

## Additional Inputs

If you have have HTML or JS files that need to be built, but aren't listed in your `manifest.json`, you can add them via the `additionalInputs` option.

The paths should be relative to the Vite's `root`, just like the `assets` option.

```ts:no-line-numbers
export default defineConfig({
  plugins: [
    webExtension({
      additionalInputs: [
        "onboarding/index.html",
        "content-scripts/injected-from-background.ts",
      ]
    }),
  ],
});
```

## Generated Files

`vite-plugin-web-extension` will automatically add any generated CSS, images, or assets to the `manifest.json` as required. If a content script's JS file imports a CSS file (or SCSS/SASS/Stylus/etc), then the resulting CSS file will be added to the content script's `css` list.

### Browser API `tabs.executeScripts`

For content scripts injected programmatically, include the script's path in the plugin's [`additionalInputs` option](#additional-inputs).

They will be built in their own build steps, and be included in the output directory, but not listed in the final `manifest.json`.

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

If you're working offline, validation will be skipped.

## Per-build Customization

### HTML Builds

By default, `vite-plugin-web-extension` will automatically configure sets of HTML input files to be built in [multi-page mode](https://vitejs.dev/guide/build.html#multi-page-app).

To customize these builds, you can provide `options.htmlViteConfig`

### Script Builds

By default, `vite-plugin-web-extension` will automatically configure vite to build script inputs (background, content scripts, additional inputs, etc) in separate steps.

If that config is does not work for your case, you can modify it via `scriptsViteConfig`.

For example, if a script requires dynamic imports, they need to be inlined because UMD doesn't support code-splitting:

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
    webExtension({ scriptViteConfig }),
  ],
});
```
