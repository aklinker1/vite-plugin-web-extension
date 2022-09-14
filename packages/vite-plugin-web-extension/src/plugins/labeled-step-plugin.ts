import { Plugin, UserConfig } from "vite";
import { PLUGIN_NAME } from "../utils/constants";
import { Logger, RESET, TEAL } from "../utils/logger";
import { getInputAbsPaths, getRootDir } from "../utils/paths";
import path from "node:path";

/**
 * A plugin that prints the inputs that will be built.
 */
export function labeledStepPlugin(
  logger: Logger,
  total: number,
  index: number
): Plugin {
  let finalConfig: UserConfig;
  let rootDir: string;
  let buildCount = 0;

  function printFirstBuild() {
    const progressLabel = `(${index + 1}/${total})`;
    const input = finalConfig.build?.rollupOptions?.input;
    if (input == null) {
      logger.warn(progressLabel + " Building unknown config");
      return;
    }

    const absPaths = getInputAbsPaths(input);
    logger.log(
      `${progressLabel} Building ${absPaths
        .map((p) => path.relative(rootDir, p))
        .map((p) => `${TEAL}${p}${RESET}`)
        .join(", ")}...`
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
        .map((p) => `${TEAL}${p}${RESET}`)
        .join(", ")}...`
    );
  }

  return {
    name: `${PLUGIN_NAME}:labeled-step`,
    configResolved(config) {
      finalConfig = config as unknown as UserConfig;
      rootDir = getRootDir(finalConfig);
    },
    buildStart() {
      if (buildCount == 0) printFirstBuild();
      else printRebuilds();

      buildCount++;
    },
  };
}
