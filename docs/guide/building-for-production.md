---
lang: en-US
title: Generating a Production Build
---

# Generating a Production Build

## Introduction

Creating a production build with Vite is as straightforward as running the build command, just like you would with a standard Vite project:

```bash
vite build
```

After running the above command, go to your `dist/` directory. There, you'll find a fully functional web extension! You can proceed to load this extension into Chrome or Firefox as an unpacked extension for testing.

## Uploading to a Store

When you're ready to publish your extension to the store, you'll need to zip up the files contained in your output directory. This can be done manually or automated with a package such as [`zip-a-folder`](https://www.npmjs.com/package/zip-a-folder).

> The following is an example of how to use `zip-a-folder`:
>
> ```ts
> import { zip } from "zip-a-folder";
>
> await zip("dist", "extension.zip");
> ```
>
> This script will zip the contents of the `dist` directory and save it as `extension.zip`.
