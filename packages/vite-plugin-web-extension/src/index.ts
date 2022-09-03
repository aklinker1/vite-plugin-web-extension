import { Plugin, UserConfig } from "vite";
import { RollupCache } from "rollup";
import { PluginOptions } from "./options";
import { getBuildConfigs } from "./utils/get-build-configs";
import { createLogger } from "./utils/logger";
import { inspect } from "node:util";

export default function browserExtension(options: PluginOptions): Plugin {
  const name = "vite-plugin-web-extension";
  const logger = createLogger(options.verbose);
  let cache: RollupCache | undefined;
  let buildConfigs: UserConfig[] = [];

  return {
    name,

    /**
     * Get a list of all the builds (and their configs) that need to occur, then override the first
     */
    async config(config, env) {
      buildConfigs = await getBuildConfigs({
        baseConfig: config,
        env,
        pluginOptions: options,
        logger,
      });
      logger.verbose(`Building ${buildConfigs.length} configs`);
      logger.verbose(inspect(buildConfigs, { depth: 5 }));
      if (buildConfigs.length === 0)
        throw Error(
          "No inputs found in manifest.json. Set `options.verbose = true` for more details."
        );
      return buildConfigs[0];
    },
  };
}
