import { InlineConfig, mergeConfig, Plugin, UserConfig } from "vite";
import { RollupCache } from "rollup";
import { PluginOptions } from "./options";
import { getBuildConfigs } from "./utils/get-build-configs";
import { createLogger } from "./utils/logger";
import { inspect } from "node:util";
import { multibuildSeries } from "./utils/multibuild-series";
import { PLUGIN_NAME } from "./utils/constants";

export default function browserExtension(options: PluginOptions): Plugin {
  const logger = createLogger(options.verbose);
  let cache: RollupCache | undefined;
  let buildConfigs: UserConfig[] = [];
  let isDevMode = false;
  let isWatchMode = false;
  let isBuildMode = true;

  return {
    name: PLUGIN_NAME,

    /**
     * Get a list of all the builds (and their configs) that need to occur, then override the first
     */
    async config(config, env) {
      isDevMode = env.command === "serve";
      let firstConfig: UserConfig;
      const allBuildConfigs = await getBuildConfigs({
        baseConfig: config,
        env,
        pluginOptions: options,
        logger,
      });
      [firstConfig, ...buildConfigs] = allBuildConfigs;
      logger.verbose(`Building ${allBuildConfigs.length} configs`);
      logger.verbose(inspect(allBuildConfigs, { depth: 5 }));

      return firstConfig;
    },
    buildEnd() {
      // Build, watch
    },
    buildStart() {
      // Build, dev, watch
      if (options.browser != null)
        logger.log(`Building for browser: ${options.browser}`);
    },
    async closeBundle() {
      // Build, watch
      await new Promise((res) => setTimeout(res));
      if (isBuildMode) await multibuildSeries(buildConfigs);
    },
    configResolved(config) {
      isWatchMode = config.inlineConfig.build?.watch === true;
      isBuildMode = !isDevMode && !isWatchMode;

      if (isDevMode) logger.verbose("Dev mode");
      if (isWatchMode) logger.verbose("Watch mode");
      if (isBuildMode) logger.verbose("Build mode");
    },
    generateBundle(options, bundle, isWrite) {
      // Build, watch
    },
    handleHotUpdate(ctx) {
      // dev
    },
  };
}
