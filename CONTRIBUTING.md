# Contributing Docs

## Tools

- `node` v14 or greater
- `pnpm` as the package manager - `npm i -g pnpm` to install

## Get Started

This repo is a monorepo. PNPM makes has all the tools built-in to make working with the repo easy.

- `demos/*` - This directory contains examples of projects using the plugin
- `lib` - This is the actual library that is uploaded to NPM
- `tests` - This is where the E2E tests are

All of the changes to the plugin itself will be in the `lib` directory.

To get started, install dependencies:

```bash
pnpm install
```

## Testing Changes

After you've made a change to the plugin, cd into one of the demos and run:

```bash
pnpm build
```

:exclamation: **You need to run `pnpm build` instead of `pnpm vite build` directly**. After your change to the plugin, it needs to be rebuilt, and `pnpm build` will take care of that for you.
