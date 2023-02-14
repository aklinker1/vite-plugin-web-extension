---
lang: en-US
title: Development
---

# Development Cycle

You have two ways to run the extension during development:

- Dev Mode
- Watch Mode

Both will automatically open a browser window and install the extension automatically.

::: info
Dev mode is recommended because it will let you iterate faster as your project grows in size.
:::

## Dev Mode

```sh
vite dev
```

Just run Vite like you would a normal project. This will spin up the dev server, and you'll have HMR for all the HTML pages in your extension!

Unfortunately, content scripts do not work with HMR. Instead, they are built using watch mode, see below. When you save a file used by a content script, it will cause the entire extension to reload once the file has finished building.

::: warning HMR requires Chrome v110 or above

Make sure your browser is up to date, or it won't work. Chrome v110 was released Feb 13, 2023.
:::

## Watch Mode

```sh
vite build --watch --mode development
```

Rather than starting the dev server, using Vite's `--watch` flag will cause it to rebuild the extension when a file is saved.

If you can't use dev mode, watch mode will be easier than installing and reloading the extension by hand. Be aware that, as an extension grows larger, watch mode can get very slow since it's doing a full production build with minimal caching.
