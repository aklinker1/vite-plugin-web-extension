import { InlineConfig } from "vite";

export const VERBOSE_LOGGER = "web-extension";

export const PLUGIN_NAME = `vite-plugin-${VERBOSE_LOGGER}`;

export const BUILD_CONTEXT_CONFIG: InlineConfig = {
  clearScreen: false,
  build: {
    emptyOutDir: false,
  },
};
