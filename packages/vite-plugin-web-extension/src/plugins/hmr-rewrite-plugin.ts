/**
 * This plugin is responsible for rewriting the entry HTML files to point towards the dev server.
 */
import * as vite from "vite";
import { HMR_REWRITE_PLUGIN_NAME } from "../constants";
import { parseHTML } from "linkedom";
import path from "path";
import { ProjectPaths } from "../options";
import { Logger } from "../logger";
import { inspect } from "util";

export function hmrRewritePlugin(config: {
  server: vite.ViteDevServer;
  paths: ProjectPaths;
  logger: Logger;
}): vite.Plugin {
  const { paths, logger, server } = config;
  let inputIds: string[] = [];

  const serverOptions = server.config.server;
  let hmrOptions =
    typeof server.config.server.hmr === "object"
      ? server.config.server.hmr
      : undefined;

  // Coped from node_modules/vite, do a global search for: vite:client-inject
  function serializeDefine(define: Record<string, any>): string {
    let res = `{`;
    const keys = Object.keys(define);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const val = define[key];
      res += `${JSON.stringify(key)}: ${handleDefineValue(val)}`;
      if (i !== keys.length - 1) {
        res += `, `;
      }
    }
    return res + `}`;
  }

  function handleDefineValue(value: any): string {
    if (typeof value === "undefined") return "undefined";
    if (typeof value === "string") return value;
    return JSON.stringify(value);
  }

  return {
    name: HMR_REWRITE_PLUGIN_NAME,

    config(config) {
      inputIds = Object.values(config.build?.rollupOptions?.input ?? {}).map(
        (inputId) => vite.normalizePath(inputId)
      );

      return {
        server: {
          hmr: {
            protocol: "http:",
            host: "localhost",
            port: 5173,
          },
        },
        define: {
          // Coped from node_modules/vite, do a global search for: vite:client-inject
          // These are used in node_modules/vite/dist/client/client.mjs, check there to see if a var
          // can be null or not.
          __MODE__: JSON.stringify(config.mode || null),
          __BASE__: JSON.stringify(serverOptions.base || "/"),
          __DEFINES__: serializeDefine(config.define || {}),
          __SERVER_HOST__: JSON.stringify(serverOptions.host || "localhost"),
          __HMR_PROTOCOL__: JSON.stringify(hmrOptions?.protocol || null),
          __HMR_HOSTNAME__: JSON.stringify(hmrOptions?.host || "localhost"),
          __HMR_PORT__: JSON.stringify(
            hmrOptions?.clientPort || hmrOptions?.port || 5173
          ),
          __HMR_DIRECT_TARGET__: JSON.stringify(
            `${serverOptions.host ?? "localhost"}:${
              serverOptions.port ?? 5173
            }${config.base || "/"}`
          ),
          __HMR_BASE__: JSON.stringify(serverOptions.base ?? "/"),
          __HMR_TIMEOUT__: JSON.stringify(hmrOptions?.timeout || 30000),
          __HMR_ENABLE_OVERLAY__: JSON.stringify(hmrOptions?.overlay !== false),
        },
      };
    },
    async transform(code, id) {
      // Only transform HTML inputs
      if (!id.endsWith(".html") || !inputIds.includes(id)) return;

      const baseUrl = "http://localhost:5173";

      // Load scripts from dev server, this adds the /@vite/client script to the page
      const serverCode = await server.transformIndexHtml(id, code);

      const { document } = parseHTML(serverCode);
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

      // Return new HTML
      return document.toString();
    },
  };
}
