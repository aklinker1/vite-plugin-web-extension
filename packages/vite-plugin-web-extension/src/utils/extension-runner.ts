import { InlineConfig } from "vite";
import webExt from "web-ext";
import { PluginOptions } from "../options";
import { getOutDir, getRootDir } from "./paths";
import * as webExtLogger from "web-ext/util/logger";
import { cosmiconfig } from "cosmiconfig";
import { Logger } from "./logger";
import { inspect } from "util";

export interface ExtensionRunner {
  reload(): Promise<void>;
  exit(): Promise<void>;
}

export async function startWebExt(options: {
  pluginOptions: PluginOptions;
  config: InlineConfig;
  logger: Logger;
}): Promise<ExtensionRunner> {
  const { pluginOptions, config, logger } = options;

  //#region Config File
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
  }).search(getRootDir(config));
  if (userConfig != null) {
    logger.verbose(`web-ext config discovered at ${userConfig.filepath}:`);
    logger.verbose(inspect(userConfig.config));
  } else {
    logger.verbose(`No web-ext config discovered`);
  }
  //#endregion

  // Customize what is logged
  webExtLogger.consoleStream.write = ({ level, msg, name }) => {
    if (level >= ERROR_LOG_LEVEL) logger.error(name, msg);
    if (level >= WARN_LOG_LEVEL) logger.warn(msg);
  };
  const runner = await webExt.cmd.run(
    {
      // Open the browser passed in plugin options, falling back to a Chromium install
      target:
        pluginOptions.browser === null || pluginOptions.browser === "firefox"
          ? null
          : "chromium",
      ...userConfig?.config,
      // These options are required or the CLI freezes on linux
      sourceDir: getOutDir(config),
      noReload: true,
      noInput: true,
    },
    {
      // Don't call `process.exit(0)` after starting web-ext
      shouldExitProgram: false,
    }
  );
  return {
    reload: () => runner.reloadAllExtensions(),
    exit: () => runner.exit(),
  };
}

// https://github.com/mozilla/web-ext/blob/e37e60a2738478f512f1255c537133321f301771/src/util/logger.js#L12
const WARN_LOG_LEVEL = 40;
const ERROR_LOG_LEVEL = 50;
