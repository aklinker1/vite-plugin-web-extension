import { InlineConfig } from "vite";

export const LOGGER_PREFIX = "vite:web-extension";

export const PLUGIN_NAME = `vite-plugin-${LOGGER_PREFIX}`;

export const BUILD_CONTEXT_CONFIG: InlineConfig = {
  clearScreen: false,
  build: {
    emptyOutDir: false,
  },
};
