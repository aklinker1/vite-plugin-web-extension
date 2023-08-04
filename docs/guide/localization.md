---
lang: en-US
title: Localization
---

# Localization

## Overview

There are two places an extension will need localized:

1. Fields in your `manifest.json`
2. Text content at runtime (UIs, notifications, etc)

## Localizing the `manifest.json`

See [Chrome's documentation](https://developer.chrome.com/docs/extensions/reference/i18n/) about how to localize your `manifest.json`:

To accomplish this with `vite-plugin-web-extension`, just put the `_locales` directory in your `<viteRoot>/public` directory. When built, that folder will be copied to the base of your output directory, right where Chrome expects them to be!

```
<viteRoot>/
  dist/
    _locales/
      en/
        messages.json
      es/
        messages.json
      ...
  public/
    _locales/
      en/
        messages.json
      es/
        messages.json
      ...
  vite.config.ts
```

## Localizing Text At Runtime

To localizing text at runtime, there are a few different options. For vanilla projects, you can use the [`browser.i18n` APIs](https://developer.chrome.com/docs/extensions/reference/i18n/) directly.

However, for Vue or React projects, you will likely want to use the framework's standard i18n library. For example, `vue-i18n`. These libraries will provide a much better developer experience when working with your framework of choice, and can _usually_ be used outside of the UI for localizing system notifications or logs.

Files containing the localized text for each language can be placed anywhere in the project, follow your i18n library's recommendation.
