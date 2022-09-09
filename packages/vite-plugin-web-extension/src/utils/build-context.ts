import { InputOption, RollupOutput } from "rollup";
import { inspect } from "util";
import * as Vite from "vite";
import { Manifest } from "webextension-polyfill";
import { PluginOptions } from "../options";
import { labeledStepPlugin } from "../plugins/labeled-step-plugin";
import { compact } from "./arrays";
import { BuildMode } from "./build-mode";
import { PLUGIN_NAME } from "./constants";
import { entryFilenameToOutput } from "./filenames";
import { Logger } from "./logger";
import { mergeConfigs } from "./merge-configs";

export type BundleMap = Record<string, string[]>;

export interface BuildContext {
  /**
   * Based on the baseConfig and new manifest, rebuild all the entrypoints and update the bundle
   * map.
   */
  rebuild(
    baseConfig: Vite.InlineConfig,
    manifest: any,
    mode: BuildMode
  ): Promise<void>;
  getBundle(): BundleMap;
}

/**
 * Keeps track of everything that needs to be build for the extension, and orchastraits the actual
 * building of each part of the extension.
 */
export function createBuildContext({
  pluginOptions,
  logger,
}: {
  pluginOptions: PluginOptions;
  logger: Logger;
}): BuildContext {
  let bundleMap: BundleMap = {};

  //#region Build Config Generation
  async function generateBuildConfigsFromManifest(
    manifest: any
  ): Promise<Vite.InlineConfig[]> {
    const configs: Vite.InlineConfig[] = [];
    const alreadyIncluded: Record<string, boolean> = {};

    const addConfig = (config: Vite.InlineConfig) => configs.push(config);
    const addMultiPageConfig = (entries: string[]) => {
      const newConfig: Vite.InlineConfig = {
        build: {
          rollupOptions: {
            input: entriesToInputs(entries),
          },
        },
      };
      return newConfig; // TODO: add pluginOptions.multiPageViteConfig
    };
    const addLibModeConfig = (entry: string) => {
      if (alreadyIncluded[entry]) return;
      alreadyIncluded[entry] = true;

      const newConfig: Vite.InlineConfig = {
        build: {
          // Excludes <root>/index.html from inputs
          rollupOptions: {},
          // Configure lib mode entrypoint
          lib: {
            name: entry.replace(/-/g, "_").toLowerCase(),
            entry: entry,
            formats: ["umd"],
            fileName: () => entryFilenameToOutput(entry),
          },
        },
      };
      addConfig(
        Vite.mergeConfig(newConfig, pluginOptions.libModeViteConfig ?? {})
      );
    };

    const { additionalHtmlInputs, additionalScriptInputs } =
      separateAdditionalInputs(pluginOptions.additionalInputs);

    // HTML Pages - multi-page-mode
    const htmlEntries = createEntryList([
      manifest.action?.default_popup,
      manifest.devtools_page,
      manifest.options_page,
      manifest.options_ui?.page,
      manifest.browser_action?.default_popup,
      manifest.page_action?.default_popup,
      manifest.sidebar_action?.default_panel,
      additionalHtmlInputs,
    ]);
    if (htmlEntries.length > 0) addMultiPageConfig(htmlEntries);

    // Sandbox - multi-page-mode
    const sandboxEntries = createEntryList([manifest.sandbox?.pages]);
    if (sandboxEntries.length > 0) addMultiPageConfig(sandboxEntries);

    // Every Background Script gets it's own config
    const backgroundScripts = createEntryList([
      manifest.background?.service_worker,
      manifest.background?.page,
      manifest.background?.scripts,
    ]);
    backgroundScripts?.forEach(addLibModeConfig);

    // Every Content Script gets it's own config
    manifest.content_scripts?.forEach((cs: Manifest.ContentScript) => {
      const csEntries = createEntryList([cs.js, cs.css]);
      csEntries.forEach(addLibModeConfig);
    });

    // Each additional script gets it's own config
    additionalScriptInputs?.forEach(addLibModeConfig);

    if (configs.length === 0)
      throw Error(
        "No inputs found in manifest.json. Set `options.verbose = true` for more details."
      );

    return configs;
  }

  function createEntryList(
    a: Array<string | string[] | undefined> | undefined
  ): string[] {
    return compact<string>(a?.flat() ?? []);
  }

  function entriesToInputs(entries: string[]): InputOption {
    return entries.reduce<Record<string, string>>((input, entry) => {
      input[entry] = entryFilenameToOutput(entry);
      return input;
    }, {});
  }

  function separateAdditionalInputs(additionalInputs?: string[]) {
    const additionalScriptInputs: string[] = [];
    const additionalHtmlInputs: string[] = [];
    additionalInputs?.forEach((additionalInput) => {
      if (entryFilenameToOutput(additionalInput).endsWith("html"))
        additionalHtmlInputs.push(additionalInput);
      else additionalScriptInputs.push(additionalInput);
    });
    return { additionalScriptInputs, additionalHtmlInputs };
  }

  function removePlugin(
    config: Vite.InlineConfig,
    pluginName: string
  ): Vite.InlineConfig {
    return {
      ...config,
      plugins:
        config.plugins?.filter(
          (plugin) =>
            plugin && (!("name" in plugin) || plugin.name !== pluginName)
        ) ?? [],
    };
  }
  //#endregion

  return {
    async rebuild(baseConfig, manifest, mode) {
      const entryConfigs = await generateBuildConfigsFromManifest(manifest);
      const totalEntries = entryConfigs.length;
      const finalConfigs = entryConfigs
        .map((entryConfig, i) => {
          return mergeConfigs([
            baseConfig,
            entryConfig,
            {
              // We shouldn't clear the screen for these internal builds
              clearScreen: false,
              // Don't copy static assets for the lib builds - already done during manifest build
              publicDir: false,
              plugins: [
                // Print a message before starting each step
                labeledStepPlugin(logger, totalEntries, i),
              ],
            },
          ]);
        })
        // Exclude this plugin from child builds to break recursion
        .map((config) => removePlugin(config, PLUGIN_NAME));

      if (pluginOptions.verbose) {
        // Print configs deep enough to include lib and rollup inputs
        logger.verbose("Final configs: " + inspect(finalConfigs, undefined, 7));
      }

      for (const config of finalConfigs) {
        const [{ output }] = (await Vite.build(config)) as RollupOutput[];
      }
    },
    getBundle() {
      return bundleMap;
    },
  };
}
