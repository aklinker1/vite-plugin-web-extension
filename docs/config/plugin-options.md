---
lang: en-US
title: Configuration
---

# Configuration

## `additionalInputs`

```ts:no-line-numbers
additionalInputs?: string[]
```

A list of paths relative to Vite's root directory that should be built along with the inputs listed in your manifest.

Usually, this is additional HTML files that aren't listed in your manifest, but still want to show, like an onboarding page. It also accepts stylesheets (CSS, SCSS, Stylus, etc) and scripts (JS or TS), essentially everything that Vite knows how to build.

Depending on the type of file listed, it will be built at different times:

- HTML files are built in the same step along side the other HTML files listed in the manifest.
- JS files are bundled individually in the order listed.
- CSS files are also bundled individually in the order listed.

## `browser`

```ts:no-line-numbers
browser?: string
```

When using `{{browser}}.` prefixes in your manifest template, setting this field will cause only the matching tags to be in the `<outDir>/manifest.json`.

See [Supporting Multiple Browsers](/guide/supporting-multiple-browsers) to learn more about how to use the `browser` option in combination with manifest templates.

## `disableAutoLaunch`

```ts:no-line-numbers
disableAutoLaunch?: boolean;
```

Setting to `true` will prevent the browser from opening when starting the dev server or running the extension in watch mode.

This can be useful in setups where opening the browser is impossible, like in the WSL/WSL2. In this case, the linux shell can't communicate with the Window's browser, and it crashes. Setting `disableAutoLaunch: true` will trigger rebuild's when you save a file, and you can open an install the extension manually.

## `htmlViteConfig`

```ts:no-line-numbers
htmlViteConfig?: import('vite').InlineConfig
```

You can provide additional Vite config to the HTML multipage build step by setting it here.

Some config cannot be overwritten because if it were, it would cause the build to fail.

::: warning
Use with caution, I have not tested the compatibility of every single Vite build option with the HTML build process. Submit an issue if you have any problems.
:::

## `manifest`

```ts:no-line-numbers
manifest?: string | (() => any) | (() => Promise<any>)
```

The manifest can either be:

- The path relative to Vite's root directory to a file containing a manifest template
- A function that returns the manifest template as a JSON object.

When not provided, it defaults to `"manifest.json"`, and the plugin looks for a template at `<viteRoot>/manifest.json`.

See [Supporting Multiple Browsers](/guide/supporting-multiple-browsers) to learn more about how to use manifest templates.

## `printSummary`

```ts:no-line-numbers
skipManifestValidation?: boolean
```

Defaults to `true`. When `true`, the plugin will print a summary of what files are being built in what order.

## `scriptViteConfig`

```ts:no-line-numbers
scriptViteConfig?: import('vite').InlineConfig
```

You can provide additional Vite config to the individually bundled JS files by setting it here.

Some config cannot be overwritten because if it were, it would cause the build to fail.

::: warning
Use with caution, I have not tested the compatibility of every single Vite build option with the HTML build process. Submit an issue if you have any problems.
:::

## `skipManifestValidation`

```ts:no-line-numbers
skipManifestValidation?: boolean
```

By default, the `<outDir>/manifest.json` will be validated against Google's JSON schema: <https://json.schemastore.org/chrome-manifest>.

Setting this to `true` will skip validation.

> The validation process downloads the schema from the above URL. If you are working offline, this step will be skipped automatically.

## `watchFilePaths`

```ts:no-line-numbers
additionalInputs?: string[]
```

A list of paths relative to Vite's root directory that cause a full rebuild of the extension during development. When one of these files is saved, the browser will be shut down, manifest regenerated, and the browser will open again.

If the `manifest` field was a string, it will be added to this list automatically. If the `manifest` field is a function, you should add any files that are used to generate the manifest (like `package.json`).

## `webExtConfig`

```ts:no-line-numbers
webExtConfig?: any
```

Configure the startup behavior of the browser.

See [`web-ext`'s source code](https://github.com/mozilla/web-ext/blob/666886f40a967b515d43cf38fc9aec67ad744d89/src/program.js#L559) for possible options.

See [Configure Browser Startup](/guide/configure-browser-startup.md) for alteratives and more details on how this field is used.
