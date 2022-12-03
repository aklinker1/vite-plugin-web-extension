import { InlineConfig } from "vite";

export function removePlugins(
  config: InlineConfig,
  pluginNames: string[]
): InlineConfig {
  return {
    ...config,
    plugins:
      config.plugins
        ?.flat()
        ?.filter(
          (plugin) =>
            plugin &&
            (!("name" in plugin) || !pluginNames.includes(plugin.name))
        ) ?? [],
  };
}
