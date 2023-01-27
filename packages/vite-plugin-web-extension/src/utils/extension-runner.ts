import webExt from "web-ext";
import { InternalPluginOptions } from "../options";
import * as webExtLogger from "web-ext/util/logger";
import { cosmiconfig } from "cosmiconfig";
import { Logger } from "./logger";
import { inspect } from "util";
import path from "path";

export interface ExtensionRunner {
  reload(): Promise<void>;
  exit(): Promise<void>;
}

// https://github.com/mozilla/web-ext/blob/e37e60a2738478f512f1255c537133321f301771/src/util/logger.js#L12
const WARN_LOG_LEVEL = 40;
const ERROR_LOG_LEVEL = 50;

export async function startWebExt(options: {
  pluginOptions: InternalPluginOptions;
  rootDir: string;
  outDir: string;
  logger: Logger;
}): Promise<ExtensionRunner> {
  const { pluginOptions, rootDir, outDir, logger } = options;

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
  }).search(rootDir);
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
      sourceDir: path.resolve(outDir),
      noReload: true,
      noInput: true,
    },
    {
      // Don't call `process.exit(0)` after starting web-ext
      shouldExitProgram: false,
    }
  );
  return {
    async reload() {
      await runner.reloadAllExtensions();
      logger.log(""); // "Last extension reload: ..." log doesn't print a newline :/
    },
    exit: () => runner.exit(),
  };
}
