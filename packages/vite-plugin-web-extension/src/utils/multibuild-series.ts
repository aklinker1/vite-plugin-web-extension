import { RollupCache } from "rollup";
import { build, UserConfig, mergeConfig } from "vite";
import { ViteMultibuild } from "./multibuild";

export const multibuildSeries: ViteMultibuild = async (configs) => {
  let cache: RollupCache | undefined;

  for (const config of configs) {
    const withCache: UserConfig = {
      build: {
        rollupOptions: {
          cache,
        },
      },
    };
    await build(mergeConfig(config, withCache));
  }
};
