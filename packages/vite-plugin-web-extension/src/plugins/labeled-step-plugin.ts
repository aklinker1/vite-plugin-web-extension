import * as vite from "vite";
import { LABELED_STEP_PLUGIN_NAME } from "../constants";
import { Logger } from "../logger";
import { getInputPaths, colorizeFilename } from "../utils";
import { ProjectPaths } from "../options";

/**
 * This plugin is in charge of logging all the steps (but not the summary).
 */
export function labeledStepPlugin(
  logger: Logger,
  total: number,
  index: number,
  paths: ProjectPaths
): vite.Plugin {
  let finalConfig: vite.ResolvedConfig;
  let buildCount = 0;

  function printFirstBuild() {
    logger.log("");

    const progressLabel = `(${index + 1}/${total})`;
    const input =
      finalConfig.build?.rollupOptions?.input || finalConfig.build.lib;
    if (!input) {
      logger.warn(`Building unknown config ${progressLabel}`);
      return;
    }

    const inputs = getInputPaths(paths, input);
    logger.log(
      `Building ${inputs.map(colorizeFilename).join(", ")} ${progressLabel}`
    );
  }

  function printRebuilds() {
    const input = finalConfig.build?.rollupOptions?.input;
    if (input == null) {
      logger.warn("Rebuilding unknown config");
      return;
    }

    const files = getInputPaths(paths, input);
    logger.log(`Rebuilding ${files.map(colorizeFilename).join(", ")}`);
  }

  return {
    name: LABELED_STEP_PLUGIN_NAME,
    configResolved(config) {
      finalConfig = config;
      if (buildCount == 0) printFirstBuild();
      else printRebuilds();

      buildCount++;
    },
  };
}
