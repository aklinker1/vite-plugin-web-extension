---
lang: en-US
title: Development
---

# Development

You have two ways to run the extension during development: dev or watch mode. Both will automatically install the extension in a browser and reload the extension on save.

## Dev Server

```sh:no-line-numbers
vite
```

Just run Vite like you would a normal project. This will spin up the dev server, and you'll have HMR for all the HTML pages in your extension!

Unfortunately, content scripts cannot be hot-module-reloaded. Instead, they are built using watch mode, see below. When you save a file used by a content script, it will cause the entire extension to reload once the file has finished building.

::: danger
There are some minimum version requirements to using dev mode based on your browser version and which manifest version you're using:

- **Chrome + MV2**: Any version will work
- **Chrome + MV3**: Chrome v110 or above is required
- **Firefox + MV2**: Any version
- **Firefox + MV3**: Untested

As of January 29, 2022, developing a Manifest V3 extension on Chrome requires v110, which is only available on the Beta release of Chrome.
:::

## Watch Mode

```sh:no-line-numbers
vite build --watch --mode development
```

Rather than starting the dev server, using Vite's `--watch` flag will cause it to rebuild the extension when a file is saved. In watch mode, it is performing a production build everything time you save a file, and the resulting extension is the exact same as what you would get if you just ran `vite build`.

::: warning
If you can't use dev mode, watch mode will be easier than installing and reloading the extension by hand. Just know that as an extension grows larger, watch mode can get very slow since it's doing a full production build with minimal caching.
:::
