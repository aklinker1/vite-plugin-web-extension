import { Plugin, UserConfig } from "vite";
import { PLUGIN_NAME } from "../utils/constants";
import { Logger, RESET, TEAL } from "../utils/logger";
import { getRootDir } from "../utils/paths";
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
  return {
    name: `${PLUGIN_NAME}:labeled-step`,
    configResolved(config) {
      finalConfig = config as unknown as UserConfig;
    },
    buildStart() {
      const progressLabel = `(${index + 1}/${total})`;
      const input = finalConfig.build?.rollupOptions?.input;
      if (input == null) {
        logger.warn(progressLabel + " Building unknown config");
        return;
      }

      let absPaths: string[];
      if (typeof input === "string") absPaths = [input];
      else if (Array.isArray(input)) absPaths = input;
      else absPaths = Object.values(input);

      const rootDir = getRootDir(finalConfig);
      logger.log(
        `${progressLabel} Building ${TEAL}[${absPaths
          .map((p) => path.relative(rootDir, p))
          .join(", ")}]${RESET}...`
      );
    },
  };
}
