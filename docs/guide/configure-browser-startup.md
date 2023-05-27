---
lang: en-US
title: Browser Startup Configuration
---

# Browser Startup Configuration

## Overview

Internally, `vite-plugin-web-extension` uses the JS API provided by [`web-ext`](https://www.npmjs.com/package/web-ext) to launch the browser and install the extension during development. It's capable of opening any Chromium-based browser (such as Chrome or Edge) and Firefox.

There are two approaches to configure browser startup:

1. Using the [`webExtConfig`](/config/plugin-options#webextconfig) option within the plugin
2. Creating config files

## The `webExtConfig` Option

This method is ideal for config that needs to be committed to version control (as it will be defined in `vite.config.ts`), or if a configuration based on a runtime value, like an environment variable, is required.

```ts
import { defineConfig } from "vite";
import webExtension from "vite-plugin-web-extension";

export default defineConfig({
  plugins: [
    webExtension({
      // ...
      webExtConfig: {
        startUrl: process.env.START_URL.split(","),
      },
    }),
  ],
});
```

## Config Files

The plugin will automatically discover config files on your filesystem. The plugin searches for config files at the paths listed below. When multiple files are found, they are merged into a single configuration.

Higher priority files (top of the list) will override fields set by lower priority files (bottom of the list).

1. `webExtConfig` option
1. `<viteRoot>/.webextrc`
1. `<viteRoot>/.webextrc.(json|json5|yml|yaml)`
1. `<cwd>/.webextrc`
1. `<cwd>/.webextrc.(json|json5|yml|yaml)`
1. `~/.webextrc`
1. `~/.webextrc.(json|json5|yml|yaml)`

> Array fields are overwritten, they are not combined.

Here's an example: Suppose you prefer to use Chrome Beta and Firefox Developer Edition, and you want one of these to open during development. You can create a `.webextrc` file in your home directory, and any project using `vite-plugin-web-extension` will use those versions instead of the default ones!

```json
// ~/.webextrc
{
  "chromiumBinary": "/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta",
  "firefox": "firefoxdeveloperedition"
}
```

## Available Options

Refer to Mozilla's [`web-ext run` CLI reference](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#web-ext-run) for a complete list of available options.

Just convert each `--kebab-case` flag to `camelCase` and include them in your configuration.

For instance, if you want to use Microsoft Edge, use the default user profile, customize the starting URLs, and alter the initial window size, your config file would look like:

<!-- prettier-ignore -->
```yml
# ./.webextrc.yml
chromiumBinary: /absolute/path/to/edge            # from --chromium-binary
chromiumProfile: /absolute/path/to/edge/profile   # from --chromium-profile
startUrl:                                         # from --start-url
  - https://google.com
  - https://duckduckgo.com
args:                                             # from --args
  - --window-size=400x300
```
