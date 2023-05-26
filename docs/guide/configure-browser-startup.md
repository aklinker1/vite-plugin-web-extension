---
lang: en-US
title: Configure Browser Startup
---

# Configure Browser Startup

## Overview

Internally, `vite-plugin-web-extension` uses the JS API provided by [`web-ext`](https://www.npmjs.com/package/web-ext) to open the browser and install the extension during development. It can open any Chromium-based browser (Chrome, Edge, etc) and Firefox.

Browser startup can be configured in multiple places:

1. The [`webExtConfig`](/config/plugin-options#webextconfig) option into the plugin
2. Config files

## The `webExtConfig` Option

This is a good way of providing config that will be checked into version control (since you will have to list the config in `vite.config.ts`), or if you need to set something based on a runtime value, like an environment variable.

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

The plugin will automatically discover config files on your filesystem. Below are the paths that the plugin will look for config files at. When multiple files are found, they are merged into a single config.

The higher priority files (top of this list) are will override fields set by the lower priority files (bottom of the list).

1. `webExtConfig` option
1. `<viteRoot>/.webextrc`
1. `<viteRoot>/.webextrc.(json|json5|yml|yaml)`
1. `<cwd>/.webextrc`
1. `<cwd>/.webextrc.(json|json5|yml|yaml)`
1. `~/.webextrc`
1. `~/.webextrc.(json|json5|yml|yaml)`

> Array fields are overwritten, not combined in any way.

Here's an example: You prefer to use Chrome Beta and Firefox Developer Edition, so you want one of those to open during development. You can create a `.webextrc` file in your home directory, and any project that uses `vite-plugin-web-extension` will know to use those versions instead of the default versions!

```json
// ~/.webextrc
{
  "chromiumBinary": "/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta",
  "firefox": "firefoxdeveloperedition"
}
```

## Available Options

See [Mozilla's `web-ext run` CLI reference](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#web-ext-run) for a list of available options.

Simply convert each `--kebab-case` flag to `camelCase`, and list them in your config.

For example, to use Microsoft Edge, use the default user profile, customize the starting URLs, and change the initial window size, here's what your config file would look like:

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
