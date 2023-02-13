---
lang: en-US
title: Get Started
---

# Get Started

`vite-plugin-web-extension` will build an entire chrome extension by adding a single plugin to your build config.

```ts:no-line-numbers
// vite.config.ts
import webExtension from "vite-plugin-web-extension";

export default defineConfig({
  plugins: [webExtension()],
});
```

## Features

- :wrench: Automatically build inputs from in your `manifest.json`
- :rocket: Open a browser and install the extension during development
- :zap: Super fast dev mode that automatically reloads your extension
- :globe_with_meridians: Supports all browsers
- :fire: Full frontend framework support (popup, options, and content scripts)
- :robot: Typescript support out of the box!
- :white_check_mark: Manifest validation

## Create a New Project

To get started, follow the [manual project setup](/guide/manual-setup.md), or bootstrap a project using one of the templates:

<CodeGroup>
  <CodeGroupItem title="PNPM" active>

```bash:no-line-numbers
pnpm create vite-plugin-web-extension <project-name>
```

  </CodeGroupItem>
  <CodeGroupItem title="NPM">

```bash:no-line-numbers
npm create vite-plugin-web-extension <project-name>
```

  </CodeGroupItem>
  <CodeGroupItem title="YARN">

```bash:no-line-numbers
yarn create vite-plugin-web-extension <project-name>
```

  </CodeGroupItem>
</CodeGroup>

Then follow the prompts! There are several starting templates to pick from:

|  Javascript  |  Typescript  |
| :----------: | :----------: |
| `vanilla-js` | `vanilla-ts` |
|   `vue-js`   |   `vue-ts`   |
|  `react-js`  |  `react-ts`  |
