<h1 align="center">Vite Plugin Web Extension</h1>

<p align="center">A simple but powerful <a href="https://vitejs.dev/">Vite</a> plugin for developing browser extensions</p>

```ts
// vite.config.ts
import webExtension from "vite-plugin-web-extension";

export default defineConfig({
  plugins: [
    webExtension({
      manifest: "manifest.json",
      assets: "assets",
    }),
  ],
});
```

## Features

- :wrench: Automatically build inputs from in your `manifest.json`
- :tada: Automatically open a browser and install the extension during development
- :zap: Super fast dev mode that automatically reloads your extension
- :globe_with_meridians: Supports all browsers
- :fire: Frontend frameworks for the popup, options page, _**and content scripts**_!
- :robot: Typescript support out of the box!
- :white_check_mark: Manifest validation

## Documentation

To get started or learn more, checkout the docs:

<https://vite-plugin-web-extension.aklinker1.io>

## Contributing

Special thanks to the contributors!

<a href="https://github.com/aklinker1/vite-plugin-web-extension/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=aklinker1/vite-plugin-web-extension" />
</a>

See the [contributing docs](CONTRIBUTING.md) to setup the project for development.
