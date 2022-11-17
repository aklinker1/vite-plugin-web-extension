import { Plugin } from "vite";
import { HMR_DEFAULT_PORT, HMR_PLUGIN_NAME } from "../utils/constants";

export function hmrPlugin(): Plugin {
  return {
    name: HMR_PLUGIN_NAME,
    apply: "serve",
    transform(code, id) {
      if (!id.endsWith(".html")) return;

      console.log(id);
      code.replace(
        "<head>",
        `<head><script type="module" src="http://localhost${HMR_DEFAULT_PORT}/@vite/client"></script>`
      );
      console.log(code);
    },
  };
}
