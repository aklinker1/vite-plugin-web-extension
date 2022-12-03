import { InlineConfig } from "vite";

export function removePlugin(
  config: InlineConfig,
  pluginName: string
): InlineConfig {
  return {
    ...config,
    plugins:
      config.plugins
        ?.flat()
        ?.filter(
          (plugin) =>
            plugin && (!("name" in plugin) || plugin.name !== pluginName)
        ) ?? [],
  };
}
