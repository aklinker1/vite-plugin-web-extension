---
lang: en-US
title: Building for Production
---

# Building for Production

Like with a regular Vite project, just run the build command:

```bash:no-line-numbers
vite build
```

Then look in your `dist/` directory. You should find a fully functioning browser extension! You can load it into Chrome or Firefox as an unpacked extension.

To publish your extension to the store, you simply need to zip up the files inside your output directory. You can do this manually, or use a package like [`zip-a-folder`](https://www.npmjs.com/package/zip-a-folder) to automate it.

```ts:no-line-numbers
import { zip } from "zip-a-folder";

await zip("dist", "extension.zip");
```
