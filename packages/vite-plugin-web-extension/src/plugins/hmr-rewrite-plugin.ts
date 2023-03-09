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
import { parseHTML } from "linkedom";
import path from "path";
import { ProjectPaths } from "../options";
import { Logger } from "../logger";
import { inspect } from "util";

export function hmrRewritePlugin(config: {
  /**
   * The resolved config.server options for the dev server vite build
   */
  server: ServerOptions;
  /**
   * The resolved config.server.hmr options for the dev server vite build
   */
  hmr: HmrOptions | undefined;
  paths: ProjectPaths;
  logger: Logger;
}): Plugin {
  const { hmr, server, paths, logger } = config;
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
          origin: "http://127.0.0.1:5173",
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

      const baseUrl = "http://localhost:5173";

      // Load scripts from dev server
      const { document } = parseHTML(code);

      const pointToDevServer = (querySelector: string, attr: string): void => {
        document.querySelectorAll(querySelector).forEach((element) => {
          const src = element.getAttribute(attr);
          if (!src) return;

          const before = element.outerHTML;

          if (path.isAbsolute(src)) {
            element.setAttribute(attr, baseUrl + src);
          } else if (src.startsWith(".")) {
            const abs = path.resolve(path.dirname(id), src);
            const pathname = path.relative(paths.rootDir, abs);
            element.setAttribute(attr, `${baseUrl}/${pathname}`);
          }

          const after = element.outerHTML;
          if (before !== after) {
            logger.verbose(
              "Transformed for dev mode: " + inspect({ before, after })
            );
          }
        });
      };

      pointToDevServer("script[type=module]", "src");
      pointToDevServer("link[rel=stylesheet]", "href");

      // Add vite client to page
      const clientScript = document.createElement("script");
      clientScript.type = "module";
      clientScript.src = `${baseUrl}/@vite/client`;
      document.head.append(clientScript);

      // Return new HTML
      return document.toString();
    },
  };
}
