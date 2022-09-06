import { Plugin, UserConfig } from "vite";
import { PluginOptions } from "../options";
import { Logger } from "../utils/logger";
import path from "node:path";
import { inspect } from "node:util";
import { resolveBrowserTagsInObject } from "../utils/resolve-browser-flags";
import fs from "node:fs/promises";
import { PLUGIN_NAME } from "../utils/constants";
import { entryFilenameToOutput } from "../utils/filenames";

export function manifestWriterPlugin({
  logger,
  pluginOptions,
  baseConfig,
}: {
  pluginOptions: PluginOptions;
  logger: Logger;
  baseConfig: UserConfig;
}) {
  async function loadManifest(): Promise<any> {
    if (typeof pluginOptions.manifest === "function") {
      logger.verbose("Loading manifest from function");
      return pluginOptions.manifest();
    }

    // Manifest string should be a path relative to the config.root
    const root = baseConfig.root ?? process.cwd();
    const manifestPath = path.resolve(root, pluginOptions.manifest);
    logger.verbose(
      `Loading manifest from file @ ${manifestPath} (root: ${root})`
    );
    const text = await fs.readFile(manifestPath, "utf-8");
    return JSON.parse(text);
  }

  const plugin: Plugin = {
    name: `${PLUGIN_NAME}:manifest-writer`,
    async buildStart() {
      const manifestTemplate = await loadManifest();
      logger.verbose("Manifest template: " + inspect(manifestTemplate));
      const manifestInput = pluginOptions.browser
        ? resolveBrowserTagsInObject(pluginOptions.browser, manifestTemplate)
        : manifestTemplate;
      logger.verbose("Manifest input: " + inspect(manifestInput));
      const manifest = replaceWithOutputs(manifestInput);
      logger.verbose("Manifest: " + inspect(manifestInput));

      this.emitFile({
        type: "asset",
        fileName: "manifest.json",
        source: JSON.stringify(manifest, null, 2),
      });
    },
  };

  return { plugin, loadManifest };
}

function replaceWithOutputs(object: any): any {
  if (Array.isArray(object)) {
    return object
      .map((item) => replaceWithOutputs(item))
      .filter((item) => !!item);
  } else if (typeof object === "object") {
    return Object.keys(object).reduce((newObject, key) => {
      // @ts-expect-error: Bad key typing
      newObject[replaceWithOutputs(key)] = replaceWithOutputs(object[key]);
      return newObject;
    }, {});
  } else if (typeof object === "string") {
    return entryFilenameToOutput(object);
  } else {
    return object;
  }
}
