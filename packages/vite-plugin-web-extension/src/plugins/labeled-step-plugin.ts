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
      if (finalConfig.build?.lib == null) {
        logger.log("Building HTML pages in multi-page mode " + progressLabel);
      } else {
        logger.log("Building in lib mode " + progressLabel);
      }
    },
  };
}
