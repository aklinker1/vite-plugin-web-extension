import { dirname, join } from "path";
import { HMRPayload, mergeConfig, PluginOption, InlineConfig } from "vite";
import fs from "fs-extra";
import { HMR_PLUGIN_NAME } from "../utils/constants";

/**
 * Because of a chrome bug, a localhost based dev server will not work, MV3 extensions cannot load
 * "external" code.
 * Instead, we write changes to the file system, and send a message to the extension to hot reload
 * via the [HMR API](https://vitejs.dev/guide/api-hmr.html)
 */
export function hmrPlugin(outDir: string): PluginOption {
  function normalizeFsUrl(url: string, type: string) {
    return join(outDir, normalizeViteUrl(url, type).replace(/^\//, ""));
  }

  return {
    name: HMR_PLUGIN_NAME,
    apply: "serve",
    enforce: "post",
    config(config) {
      // Set the path host and path to / to use the filesystem (file:///)
      // const hrmConfig: InlineConfig = {
      //   server: {
      //     origin: "file://",
      //     host: "/",
      //     base: "/",
      //   },
      // };
      // return mergeConfig(config, hrmConfig);
    },
    async configureServer(server) {
      const ogWsSend: (payload: HMRPayload) => void = server.ws.send;

      server.ws.send = async function (payload: HMRPayload) {
        if (payload.type === "update") {
          for (const update of payload.updates) {
            await writeToDisk(update.path);
            if (update.acceptedPath !== update.path)
              await writeToDisk(update.acceptedPath);
          }

          payload.updates = payload.updates.map((update) => {
            const isJsUpdate = update.type === "js-update";

            if (!isJsUpdate) return update;

            return {
              ...update,
              path: `${update.path}.js`,
              acceptedPath: `${update.acceptedPath}.js`,
            };
          });
        }
        ogWsSend.call(this, payload);
      };

      async function writeToDisk(url: string) {
        const result = await server.transformRequest(
          url.replace(/^\/@id\//, "")
        );
        let code = result?.code;
        if (!code) return;

        const urlModule = await server.moduleGraph.getModuleByUrl(url);
        const importedModules = urlModule?.importedModules;

        if (importedModules) {
          for (const mod of importedModules) {
            code = code.replace(mod.url, normalizeViteUrl(mod.url, mod.type));
            writeToDisk(mod.url);
          }
        }

        if (urlModule?.url) {
          code = code
            .replace(/\/@vite\/client/g, "/dist/mv3client.mjs")
            .replace(/(\/\.vite\/deps\/\S+?)\?v=\w+/g, "$1");

          const targetFile = normalizeFsUrl(urlModule.url, urlModule.type);
          await fs.ensureDir(dirname(targetFile));
          await fs.writeFile(targetFile, code);
        }
      }

      Object.keys(server.config.build.rollupOptions.input!).map((entry) =>
        writeToDisk(`/${entry}/main.ts`)
      );
    },
  };
}

function normalizeViteUrl(url: string, type: string) {
  url = url.replace(/\?v=\w+$/, "");

  if (type === "js" && !url.endsWith(".js") && !url.endsWith(".mjs"))
    url = `${url}.js`;

  return url;
}
