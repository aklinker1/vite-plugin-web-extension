/**
 * This plugin is responsible for rewriting the entry HTML files to point towards the dev server.
 */
import {
  HmrOptions,
  InlineConfig,
  mergeConfig,
  Plugin,
  ServerOptions,
} from "vite";
import { HMR_REWRITE_PLUGIN_NAME } from "../constants";

export function hmrRewritePlugin(config: {
  /**
   * The resolved config.server options for the dev server vite build
   */
  server: ServerOptions;
  /**
   * The resolved config.server.hmr options for the dev server vite build
   */
  hmr: HmrOptions | undefined;
}): Plugin {
  const { hmr, server } = config;
  let inputIds: string[] = [];

  // Coped from node_modules/vite, do a global search for: vite:client-inject
  function serializeDefine(define: any): string {
    let res = `{`;
    for (const key in define) {
      const val = define[key];
      res += `${JSON.stringify(key)}: ${
        typeof val === "string" ? `(${val})` : JSON.stringify(val)
      }, `;
    }
    return res + `}`;
  }

  return {
    name: HMR_REWRITE_PLUGIN_NAME,

    config(config) {
      inputIds = Object.values(config.build?.rollupOptions?.input ?? {});

      const hmrConfig: InlineConfig = {
        server: {
          hmr: {
            protocol: "http:",
            host: "127.0.0.1",
            port: 5173,
          },
        },
        define: {
          // Coped from node_modules/vite, do a global search for: vite:client-inject
          // These are used in node_modules/vite/dist/client/client.mjs, check there to see if a var
          // can be null or not.
          __MODE__: JSON.stringify(config.mode || null),
          __BASE__: JSON.stringify(server.base || "/"),
          __DEFINES__: serializeDefine(config.define || {}),
          __SERVER_HOST__: JSON.stringify(server.host || "localhost"),
          __HMR_PROTOCOL__: JSON.stringify(hmr?.protocol || null),
          __HMR_HOSTNAME__: JSON.stringify(hmr?.host || "localhost"),
          __HMR_PORT__: JSON.stringify(hmr?.clientPort || hmr?.port || 5173),
          __HMR_DIRECT_TARGET__: JSON.stringify(
            `${server.host ?? "localhost"}:${server.port ?? 5173}${
              config.base || "/"
            }`
          ),
          __HMR_BASE__: JSON.stringify(server.base ?? "/"),
          __HMR_TIMEOUT__: JSON.stringify(hmr?.timeout || 30000),
          __HMR_ENABLE_OVERLAY__: JSON.stringify(hmr?.overlay !== false),
        },
      };
      return mergeConfig(config, hmrConfig);
    },
    transform(code, id) {
      // Only transform HTML inputs
      if (!id.endsWith(".html") || !inputIds.includes(id)) return;

      // Load HTML files from localhost
      code = code.replaceAll(
        '<script type="module" src="',
        '<script type="module" src="http://localhost:5173'
      );

      // Add the vite client script to the code.
      return code.replace(
        "</script>",
        '</script>\n    <script type="module" src="http://localhost:5173/@vite/client"></script>'
      );
    },
  };
}
