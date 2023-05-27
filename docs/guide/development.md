---
lang: en-US
title: Development Cycle
---

# Understanding the Development Cycle

While developing your browser extension, there are two ways to run it:

- Development Mode
- Watch Mode

Both methods will automatically open a new browser window and install the extension for you.

::: info
For most use cases, Development Mode is recommended as it can significantly speed up the development process, especially as your project scales.
:::

## Development Mode

To start the extension in development mode, run the following command:

```sh
vite dev
```

This command starts the Vite development server, similar to how you would for any other Vite project. Notably, you will have Hot Module Replacement (HMR) enabled for all HTML pages in your extension!

However, please note that content scripts do not support HMR. They are built using [Watch Mode](#watch-mode), see below. Thus, when you modify and save a file associated with a content script, it will trigger a full reload of the extension once the file has finished building.

::: warning HMR requires Chrome v110 or above
Ensure your browser is up to date. HMR functionality is only supported in Chrome v110 or later versions, which was released on February 13, 2023.
:::

## Watch Mode

To start the extension in watch mode, run the following command:

```sh
vite build --watch --mode development
```

Instead of launching the development server, using the `--watch` flag with Vite will instruct it to rebuild the extension each time you save a file.

If [Development Mode](#development-mode) does not work for you, Watch Mode can be a convenient alternative. However, be aware that as an extension grows in complexity, Watch Mode may become significantly slower as it completes a full production build with minimal caching, after each change.
