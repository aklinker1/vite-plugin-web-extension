import { Plugin, UserConfig } from "vite";
import { PLUGIN_NAME } from "../utils/constants";
import { Logger } from "../utils/logger";

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
      process.stdout.write("\n");
      const progressLabel = `(${index + 1}/${total})`;
      if (finalConfig.build?.lib) {
        logger.log(
          `${progressLabel} Building ${finalConfig.build.lib.entry} in lib mode`
        );
      } else if (finalConfig.build?.rollupOptions?.input) {
        logger.log(progressLabel + " Building HTML pages in multi-page mode");
      } else {
        logger.warn(progressLabel + " Building unknown config");
      }
    },
  };
}
