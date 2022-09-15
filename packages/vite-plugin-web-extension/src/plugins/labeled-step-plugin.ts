import { Plugin, ResolvedConfig, UserConfig } from "vite";
import {
  LABELED_STEP_PLUGIN_NAME,
  MANIFEST_LOADER_PLUGIN_NAME,
} from "../utils/constants";
import { Logger } from "../utils/logger";
import { getInputAbsPaths, getRootDir } from "../utils/paths";
import path from "node:path";
import { colorizeFilename } from "../utils/filenames";

/**
 * A plugin that prints the inputs that will be built.
 */
export function labeledStepPlugin(
  logger: Logger,
  total: number,
  index: number
): Plugin {
  let finalConfig: ResolvedConfig;
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
