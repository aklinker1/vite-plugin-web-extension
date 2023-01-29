import { cosmiconfig } from "cosmiconfig";
import { inspect } from "node:util";
import { ProjectPaths, ResolvedOptions } from "../options";
import { Logger } from "../logger";
import { ExtensionRunner } from "./interface";
import * as webExtLogger from "web-ext/util/logger";
import webExt, { WebExtRunInstance } from "web-ext";

/**
 * Create an implementation of the `ExtensionRunner` interface that uses `web-ext` to run the
 * extension during development.
 */
export function createWebExtRunner(
  options: WebExtRunnerOptions
): ExtensionRunner {
  const { pluginOptions, paths, logger } = options;

  let runner: WebExtRunInstance;

  return {
    async openBrowser() {
      // Use the plugin's logger instead of web-ext's built-in one.
      webExtLogger.consoleStream.write = ({ level, msg, name }) => {
        if (level >= ERROR_LOG_LEVEL) logger.error(name, msg);
        if (level >= WARN_LOG_LEVEL) logger.warn(msg);
      };

      const config = await loadConfig({ logger, paths });
      const target =
        pluginOptions.browser === null || pluginOptions.browser === "firefox"
          ? null
          : "chromium";

      const sourceDir = paths.outDir;

      runner = await webExt.cmd.run(
        {
          ...config,
          target,
          sourceDir,
          // The plugin handles reloads, so disable auto-reload behaviors in web-ext
          noReload: true,
          noInput: true,
        },
        {
          // Don't call `process.exit(0)` after starting web-ext
          shouldExitProgram: false,
        }
      );
    },

    async reload() {
      await runner.reloadAllExtensions();
      logger.log(""); // "Last extension reload: ..." log doesn't print a newline, so we need to add one.
    },

    async exit() {
      return runner.exit();
    },
  };
}

// https://github.com/mozilla/web-ext/blob/e37e60a2738478f512f1255c537133321f301771/src/util/logger.js#L12
const WARN_LOG_LEVEL = 40;
const ERROR_LOG_LEVEL = 50;

export interface WebExtRunnerOptions {
  pluginOptions: ResolvedOptions;
  paths: ProjectPaths;
  logger: Logger;
}

async function loadConfig({
  logger,
  paths,
}: {
  logger: Logger;
  paths: ProjectPaths;
}): Promise<any> {
  const userConfig = await cosmiconfig("web-ext", {
    packageProp: "webExt",
    searchPlaces: [
      // Cosmiconfig Defaults
      "package.json",
      ".web-extrc",
      ".web-extrc.json",
      ".web-extrc.yaml",
      ".web-extrc.yml",
      ".web-extrc.js",
      ".web-extrc.cjs",
      "web-ext.config.js",
      "web-ext.config.cjs",
      // web-ext equivalents:
      // https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/#automatic-discovery-of-configuration-files
      "web-ext-config.js",
      "web-ext-config.cjs",
      ".web-ext-config.js",
      ".web-ext-config.cjs",
    ],
  }).search(paths.rootDir);

  if (userConfig != null) {
    logger.verbose(`web-ext config discovered at ${userConfig.filepath}:`);
    logger.verbose(inspect(userConfig.config));
  } else {
    logger.verbose(`No web-ext config discovered`);
  }

  return userConfig?.config;
}
