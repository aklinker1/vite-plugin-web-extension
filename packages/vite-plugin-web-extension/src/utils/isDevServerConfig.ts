import { InlineConfig } from "vite";
import { BuildMode } from "../build/BuildMode";
import { HMR_PLUGIN_NAME } from "./constants";

export function isDevServerConfig(
  mode: BuildMode,
  config: Pick<InlineConfig, "plugins">
): boolean {
  return (
    mode === BuildMode.DEV &&
    !!config.plugins
      ?.flat()
      .find(
        (plugin) =>
          !!plugin && "name" in plugin && plugin?.name === HMR_PLUGIN_NAME
      )
  );
}
