---
lang: en-US
title: Configure Browser Startup
---

# Configure Browser Startup

Internally, `vite-plugin-web-extension` uses [`web-ext`](https://www.npmjs.com/package/web-ext) from Mozilla to open the browser and install the extension during development. It can open any Chromium-based browser (Chrome, Edge, etc) and Firefox.

You can configure it's startup behavior in two ways:

1. Pass [`webExtConfig`](/config/#webextconfig) option into the plugin
2. Create config files

## Pass `webExtConfig`

This is a good option if you're OK with checking the config into version control, since you will have to list the config in `vite.config.ts`. Or if you need to set something based on a runtime value, like an environment variable.

```ts:no-line-numbers
import { defineConfig } from 'vite';
import webExtension from 'vite-plugin-web-extension';

export default defineConfig({
  plugins: [
    webExtension({
      // ...
      webExtConfig: {
        startUrl: ["https://google.com"],
      },
    }),
  ]
})
```

## Create Config Files

The higher priority sources (top of this list) are will override fields set by the lower priority sources (bottom of the list).

1. `webExtConfig` option
1. `<viteRoot>/.webextrc`
1. `<viteRoot>/.webextrc.(json|json5|yml|yaml)`
1. `<cwd>/.webextrc`
1. `<cwd>/.webextrc.(json|json5|yml|yaml)`
1. `~/.webextrc`
1. `~/.webextrc.(json|json5|yml|yaml)`

> Array fields are overwritten, not combined in any way.

Here's an example: You prefer to use Chrome Beta and Firefox Developer Edition, so you want one of those to open during development. You can create a `.webextrc` file in your home directory, and any project that uses `vite-plugin-web-extension` will know to use those versions instead of the default versions!

```jsonc:no-line-numbers
// ~/.webextrc
{
  "chromiumBinary": "/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta",
  "firefox": "firefoxdeveloperedition",
}
```
