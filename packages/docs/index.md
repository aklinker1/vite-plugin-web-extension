---
lang: en-US
title: Get Started
---

# Get Started

`vite-plugin-web-extension` lets you get started making Chrome extensions with just a manifest.json and a simple Vite build config:

It works by automatically detecting inputs from your manifest, then it orcastraits the different build steps for you.

## Features

- :wrench: Automatically build inputs from in your `manifest.json`
- :rocket: Open a browser and install the extension during development
- :zap: Super fast dev mode that automatically reloads your extension
- :globe_with_meridians: Supports all browsers
- :fire: Frontend frameworks for the popup, options page, _**and content scripts**_!
- :robot: Typescript support out of the box!
- :white_check_mark: Manifest validation

## Scaffolding a New Extension

To get started quickly, use the `create-vite-plugin-web-extension` starter kit to bootstrap a project for you automatically:

<CodeGroup>
  <CodeGroupItem title="PNPM" active>

```bash:no-line-numbers
pnpm create vite-plugin-web-extension
```

  </CodeGroupItem>
  <CodeGroupItem title="NPM">

```bash:no-line-numbers
npm create vite-plugin-web-extension
```

  </CodeGroupItem>
  <CodeGroupItem title="YARN">

```bash:no-line-numbers
yarn create vite-plugin-web-extension
```

  </CodeGroupItem>
</CodeGroup>

Then follow the prompts! There are several starting templates to pick from:

|  Javascript  |  Typescript  |
| :----------: | :----------: |
| `vanilla-js` | `vanilla-ts` |
|   `vue-js`   |   `vue-ts`   |

> Want more starter kits? Feel free to open a PR!

See [Manual Project Setup](/guide/manual-installation.md) for more details on how to setup a project without using a starter kit.

## How does the plugin work?

The plugin converts a single build into a 2 step process:

1. Bundle all the HTML entry-points as a [multi-page app](https://vitejs.dev/guide/build.html#multi-page-app)
2. Bundle everything else (background scripts/service worker, content scripts, etc) individually in [library mode](https://vitejs.dev/guide/build.html#library-mode)

Scripts have to be bundled individually, separate from each other and the HTML entry-points, because they cannot import additional JS files. Each entry-point needs to have everything it needs inside that one file listed in the final manifest.

During development, the plugin will manage rebuilding the extension AND reloading it in your browser.
