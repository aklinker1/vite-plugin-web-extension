import { PluginOption } from "vite";

/**
 * Remove a plugin by name from a `Array<PluginOption | PluginOption[]>`. Leaves the structure the
 * same, just removes any plugins that have the same name
 */
export async function removePlugin(
  plugins: Array<PluginOption | PluginOption[]> | undefined,
  pluginNameToRemove: string
): Promise<Array<PluginOption | PluginOption[]> | undefined> {
  if (!plugins) return plugins;

  const newPlugins: Array<PluginOption | PluginOption[]> = [];
  for (const itemPromise of plugins) {
    const item = await itemPromise;
    if (Array.isArray(item))
      newPlugins.push(await removePlugin(item, pluginNameToRemove));
    else if (!item || item.name !== pluginNameToRemove) newPlugins.push(item);
  }

  return newPlugins;
}
