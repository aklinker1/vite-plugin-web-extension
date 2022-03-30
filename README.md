<h1 align="center">Vite Plugin Web Extension</h1>

<p align="center">A simple but powerful <a href="https://vitejs.dev/">Vite</a> plugin for developing browser extensions</p>

```ts
// vite.config.ts
import webExtension from "vite-plugin-web-extension";

export default defineConfig({
  plugins: [
    webExtension({
      manifest: path.resolve(__dirname, "manifest.json"),
      assets: "assets",
    }),
  ],
});
```

## Features

- :wrench: Automatically build inputs from in your `manifest.json`
- :zap: Super fast watch mode that automatically reloads your extension
- :globe_with_meridians: Supports all browsers
- :fire: Frontend frameworks for the popup, options page, _**and content scripts**_!
- :robot: Typescript support out of the box!
- :white_check_mark: Manifest validation

## Contributing

Special thanks to the contributors!

<!-- readme: contributors -start -->
<table>
<tr>
    <td align="center">
        <a href="https://github.com/aklinker1">
            <img src="https://avatars.githubusercontent.com/u/10101283?v=4" width="100;" alt="aklinker1"/>
            <br />
            <sub><b>Aaron Klinker</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/KentoNishi">
            <img src="https://avatars.githubusercontent.com/u/38841491?v=4" width="100;" alt="KentoNishi"/>
            <br />
            <sub><b>Kento Nishi</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/r2dev2">
            <img src="https://avatars.githubusercontent.com/u/50760816?v=4" width="100;" alt="r2dev2"/>
            <br />
            <sub><b>Ronak Badhe</b></sub>
        </a>
    </td></tr>
</table>
<!-- readme: contributors -end -->

See the [contributing docs](CONTRIBUTING.md) to setup the project for development.

## Installation

```bash
npm i -D vite-plugin-web-extension
```

## Roadmap

- [x] `v0.1.0` Build for production
- [x] `v0.2.0` CSS inputs & generated files
- [x] `v0.3.0` Dev mode with automatic reload
- [x] `v0.5.0` Manifest V3 support
- [x] `v0.6.0` Frontend framework support in content scripts
- [x] `v0.7.0` Browser specific flags in the manifest
- [ ] HMR for html pages

## Setup and Usage

Lets say your project looks like this:

<pre>
<strong>dist/</strong>
   <i>build output...</i>
<strong>src/</strong>
   <strong>assets/</strong>
      <i>icon-16.png</i>
      <i>icon-48.png</i>
      <i>icon-128.png</i>
   <strong>background/</strong>
      <i>index.ts</i>
   <strong>popup/</strong>
      <i>index.html</i>
   <i>manifest.json</i>
<i>package.json</i>
<i>vite.config.ts</i>
<i>...</i>
</pre>

Here's the minimal setup required:

```ts
// vite.config.ts
import webExtension from "vite-plugin-web-extension";

export default defineConfig({
  root: "src",
  // Configure our outputs - nothing special, this is normal vite config
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
  // Add the webExtension plugin
  plugins: [
    webExtension({
      manifest: path.resolve(__dirname, "src/manifest.json"),
      assets: "assets",
    }),
  ],
});
```

> Note that the `assets` option is relative to your Vite `root`. In this case, it's pointing to `src/assets`, not just `assets`.

> You don't need to specify a `root` if you don't want to. When excluded, it defaults to the directory your `vite.config.ts` is in.

For the input `manifest` option, all paths should use their real file extension and the paths should be relative to your vite `root`.

```jsonc
// src/manifest.json
{
  "name": "Example",
  "version": "1.0.0",
  "manifest_version": "2",
  "icons": {
    // Relative to "src"
    "16": "assets/icon-16.png",
    "48": "assets/icon-48.png",
    "128": "assets/icon-128.png"
  },
  "browser_action": {
    "default_icon": "assets/icon-128.png",
    // Relative to "src"
    "default_popup": "popup/index.html"
  },
  "background": {
    // Relative to "src", using real .ts file extension
    "scripts": "background/index.ts"
  }
}
```

And there you go!

Run `vite build` and you should see a fully compiled and working browser extension in your `dist/` directory!

## How does this work?

The build process happens in 2 steps:

1. Bundle all the HTML entry-points as a [multi-page app](https://vitejs.dev/guide/build.html#multi-page-app)
2. Bundle everything else (background scripts/service worker, content scripts, etc) individually in [library mode](https://vitejs.dev/guide/build.html#library-mode)

Scripts have to be bundled individually, separate from each other and the HTML entry-points, because they cannot import additional JS files. Each entry-point needs to have everything it needs inside that one file listed in the final manifest.

## Adding Frontend Frameworks

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

## Advanced Features

### Configuring Browser Startup

This plugin uses `web-ext` under the hood to startup a browser and install the extension in dev mode. You can configure `web-ext` via the `webExtConfig` option.

> See [`web-ext` CLI docs](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/)

This plugin executes `web-ext` from JS directly, rather than the CLI. Unfortunately, there is [minimal docs around configuring it when ran from JS](https://github.com/mozilla/web-ext#using-web-ext-in-nodejs-code), so we have to translate the CLI flags into their JS config counterparts.

In general you:

1. Convert the --flag-name to camelCase
2. Set the value equal to...
   - If it's a single value, just the string value
   - If it's an array (or accepts the flag multiple times), an array of string values

> If someone can find a list of `web-ext`'s JS config options, I'll add a link to it here so it's not so guess-and-check.

Here are some examples:

```text
webExtension({
  webExtConfig: {
    // --chromium-binary /path/to/google-chrome
    "chromiumBinary": "/path/to/google-chrome",
    // --start-url google.com --start-url duckduckgo.com
    "startUrl": ["google.com", "duckduckgo.com"],
    // --watch-ignored *.md *.log
    "watchIgnored": ["*.md", "*.log"],
  }
});
```

Also see #22 for a real use case of changing the startup chrome window size

### Watch Mode

To reload the extension when a file changes, run vite with the `--watch` flag

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

### Additional Inputs

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

### CSS

For HTML entry points like the popup or options page, css is automatically output and referenced in the built HTML. There's nothing you need to do!

#### Manifest `content_scripts`

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

#### Browser API `tabs.executeScripts`

For content scripts injected programmatically, include the script's path in the plugin's [`additionalInputs` option](#additional-inputs)

### Dynamic Manifests

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

#### Browser Specific Manifest Fields

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

### Manifest Validation

Whenever your manifest is generated, it gets validated against Google's JSON schema: https://json.schemastore.org/chrome-manifest

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
