---
lang: en-US
title: Frontend Frameworks
---

# Frontend Frameworks

To use a framework like Vue, React, or Svelte in your extension, simply include the framework's Vite plugin along with `vite-plugin-web-extension` in your config!

<CodeGroup>
  <CodeGroupItem title="Vue" active>

```ts
// vite.config.ts
import { defineConfig } from "vite";
import webExtension from "vite-plugin-web-extension";
import vue from "@vite/plugin-vue";

export default defineConfig({
  plugins: [
    vue(),
    webExtension({
      // ...
    }),
  ],
});
```

  </CodeGroupItem>
  <CodeGroupItem title="React">

```ts
// vite.config.ts
import { defineConfig } from "vite";
import webExtension from "vite-plugin-web-extension";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      // ...
    }),
  ],
});
```

  </CodeGroupItem>
  <CodeGroupItem title="React (SWC)">

```ts
// vite.config.ts
import { defineConfig } from "vite";
import webExtension from "vite-plugin-web-extension";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      // ...
    }),
  ],
});
```

  </CodeGroupItem>
  <CodeGroupItem title="Svelte">

```ts
// vite.config.ts
import { defineConfig } from "vite";
import webExtension from "vite-plugin-web-extension";
import svelte from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [
    svelte(),
    webExtension({
      // ...
    }),
  ],
});
```

  </CodeGroupItem>
</CodeGroup>

That's it! You can now use your framework wherever you'd like, the popup, options page, or even content scripts.
