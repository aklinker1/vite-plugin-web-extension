---
lang: en-US
title: Building for Production
---

# Building for Production

## Overview

Like with a regular Vite project, just run the build command:

```bash
vite build
```

Then look in your `dist/` directory. You should find a fully functioning browser extension! You can load it into Chrome or Firefox as an unpacked extension.

## Zipping

To publish your extension to the store, you simply need to zip up the files inside your output directory. You can do this manually, or use a package like [`zip-a-folder`](https://www.npmjs.com/package/zip-a-folder) to automate it.

```ts
import { zip } from "zip-a-folder";

await zip("dist", "extension.zip");
```
