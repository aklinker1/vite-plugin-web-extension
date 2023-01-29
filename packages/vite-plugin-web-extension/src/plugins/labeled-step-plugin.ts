import * as vite from "vite";
import { LABELED_STEP_PLUGIN_NAME } from "../constants";
import { Logger } from "../logger";
import { getInputAbsPaths, getRootDir, colorizeFilename } from "../utils";
import path from "node:path";

/**
 * This plugin is in charge of logging all the steps (but not the summary).
 */
export function labeledStepPlugin(
  logger: Logger,
  total: number,
  index: number
): vite.Plugin {
  let finalConfig: vite.ResolvedConfig;
  let rootDir: string;
  let buildCount = 0;

  function printFirstBuild() {
    logger.log("");

    const progressLabel = `(${index + 1}/${total})`;
    const input = finalConfig.build?.rollupOptions?.input;
    if (input == null) {
      logger.warn(`Building unknown config ${progressLabel}`);
      return;
    }

    const absPaths = getInputAbsPaths(input);
    logger.log(
      `Building ${absPaths
        .map((p) => path.relative(rootDir, p))
        .map(colorizeFilename)
        .join(", ")} ${progressLabel}`
    );
  }

  function printRebuilds() {
    const input = finalConfig.build?.rollupOptions?.input;
    if (input == null) {
      logger.warn("Rebuilding unknown config");
      return;
    }

    const absPaths = getInputAbsPaths(input);
    logger.log(
      `Rebuilding ${absPaths
        .map((p) => path.relative(rootDir, p))
        .map(colorizeFilename)
        .join(", ")}`
    );
  }

  return {
    name: LABELED_STEP_PLUGIN_NAME,
    configResolved(config) {
      finalConfig = config;
      rootDir = getRootDir(finalConfig);
      if (buildCount == 0) printFirstBuild();
      else printRebuilds();

      buildCount++;
    },
  };
}
