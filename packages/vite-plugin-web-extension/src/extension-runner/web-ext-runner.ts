import { ProjectPaths, ResolvedOptions } from "../options";
import { Logger } from "../logger";
import { ExtensionRunner } from "./interface";
import * as webExtLogger from "web-ext-run/util/logger";
import webExt, { WebExtRunInstance } from "web-ext-run";
import { inspect } from "node:util";
import { loadConfig as loadFsConfig } from "../config";

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

      const initialConfig = await loadConfig({ pluginOptions, logger, paths });
      const target =
        pluginOptions.browser === "chrome"
          ? "chromium"
          : pluginOptions.browser === null ||
            pluginOptions.browser === "firefox"
          ? "firefox-desktop"
          : initialConfig.target ?? "chromium";

      const sourceDir = paths.outDir;
      const config = {
        ...initialConfig,
        target,
        sourceDir,
        // The plugin handles reloads, so disable auto-reload behaviors in web-ext
        noReload: true,
        noInput: true,
      }
      logger.verbose("web-ext config:" + inspect(config));


      runner = await webExt.cmd.run(
        config,
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
  pluginOptions,
  paths,
  logger,
}: {
  pluginOptions: ResolvedOptions;
  paths: ProjectPaths;
  logger: Logger;
}): Promise<any> {
  const res = await loadFsConfig({
    overrides: pluginOptions.webExtConfig,
    paths,
    logger,
  });

  logger.verbose("Config result: " + inspect(res, undefined, 3));
  return res.config;
}
