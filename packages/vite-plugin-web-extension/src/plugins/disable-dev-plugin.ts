import { Plugin } from "vite";
import { DISABLE_DEV_PLUGIN_NAME } from "../utils/constants";

/**
 * HMR is not ran at the top level. Instead, it is ran in a child build. So we should disable
 * `vite dev` and provide a hint to fix this.
 */
export function disableDevPlugin(): Plugin {
  return {
    name: DISABLE_DEV_PLUGIN_NAME,
    apply: "serve",
    config() {
      throw Error(
        "vite-plugin-web-extension does not support running in dev mode directly.\n\nUse `HTML_HMR=true vite build --watch` instead\n"
      );
    },
  };
}
