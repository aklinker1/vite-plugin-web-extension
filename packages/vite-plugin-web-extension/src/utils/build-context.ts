import { OutputAsset, OutputChunk, RollupWatcher } from "rollup";
import { inspect } from "util";
import * as Vite from "vite";
import { Manifest } from "webextension-polyfill";
import { InternalPluginOptions } from "../options";
import { labeledStepPlugin } from "../plugins/labeled-step-plugin";
import { compact } from "./arrays";
import { BuildMode } from "./build-mode";
import { MANIFEST_LOADER_PLUGIN_NAME } from "./constants";
import { colorizeFilename, entryFilenameToInput } from "./filenames";
import { BOLD, DIM, Logger, RESET, GREEN } from "./logger";
import { mergeConfigs } from "./merge-configs";
import path from "node:path";
import { getInputAbsPaths } from "./paths";
import uniqBy from "lodash.uniqby";
import { createMultibuildCompleteManager } from "../plugins/multibuild-complete-plugin";

interface RebuildOptions {
  rootDir: string;
  userConfig: Vite.UserConfig;
  manifest: any;
  mode: BuildMode;
  onSuccess?: () => Promise<void> | void;
}

export interface BuildContext {
  /**
   * Based on the user config and new manifest, rebuild all the entrypoints and update the bundle
   * map.
   */
  rebuild(rebuildOptions: RebuildOptions): Promise<void>;
  getBundles(): Array<OutputChunk | OutputAsset>;
}

/**
 * Keeps track of everything that needs to be build for the extension, and orchastraits the actual
 * building of each part of the extension.
 */
export function createBuildContext({
  pluginOptions,
  logger,
}: {
  pluginOptions: InternalPluginOptions;
  logger: Logger;
}): BuildContext {
  /**
   * Tracks an each input path relative to the Vite root, to their output filename and a list of
   * generated assets.
   */
  let bundles: Array<OutputChunk | OutputAsset> = [];
  let activeWatchers: RollupWatcher[] = [];

  //#region Build Config Generation
  async function generateBuildConfigs({
    rootDir,
    userConfig,
    manifest,
    onSuccess,
    mode,
  }: RebuildOptions) {
    const multibuildManager = createMultibuildCompleteManager(async () => {
      // This prints before the manifest plugin continues in watch mode
      if (mode == BuildMode.WATCH) printCompleted();
      await onSuccess?.();
    });
    const entryConfigs = await generateBuildConfigsFromManifest(
      rootDir,
      manifest
    );
    const totalEntries = entryConfigs.length;
    const finalConfigs = entryConfigs
      .map((entryConfig, i) =>
        mergeConfigs(userConfig, entryConfig, {
          // We shouldn't clear the screen for these internal builds
          clearScreen: false,
          // Don't copy static assets for the lib builds - already done during manifest build
          publicDir: false,
          // Don't empty the outDir, this is handled in the parent, manifest build process
          build: { emptyOutDir: false },
          plugins: [
            // Print a message before starting each step
            labeledStepPlugin(logger, totalEntries, i),
            // ...(mode === BuildMode.WATCH ? [multibuildManager.plugin()] : []),
            multibuildManager.plugin(),
          ],
        })
      )
      // Exclude this plugin from child builds to break recursion
      .map((config) => removePlugin(config, MANIFEST_LOADER_PLUGIN_NAME));
    return finalConfigs;
  }

  async function generateBuildConfigsFromManifest(
    rootDir: string,
    manifest: any
  ): Promise<Vite.InlineConfig[]> {
    const configs: Vite.InlineConfig[] = [];
    const alreadyIncluded: Record<string, boolean> = {};

    const addConfig = (config: Vite.InlineConfig) => configs.push(config);
    const addHtmlConfig = (entries: string[]) => {
      const htmlConfig = mergeConfigs(
        {
          build: {
            rollupOptions: {
              input: entries.reduce<Record<string, string>>((input, entry) => {
                input[entryFilenameToInput(entry)] = path.resolve(
                  rootDir,
                  entry
                );
                return input;
              }, {}),
            },
          },
        },
        pluginOptions.htmlViteConfig ?? {}
      );
      addConfig(htmlConfig);
    };
    const addScriptConfig = (entry: string) => {
      if (alreadyIncluded[entry]) return;
      alreadyIncluded[entry] = true;

      const moduleId = entryFilenameToInput(entry);
      /**
       * "content-scripts/some-script/index" -> "content-scripts/some-script/"
       * "some-script" -> ""
       */
      const outputDir = moduleId.includes("/")
        ? path.dirname(moduleId) + "/"
        : "";
      const scriptConfig = mergeConfigs(
        {
          build: {
            rollupOptions: {
              input: {
                [moduleId]: path.resolve(rootDir, entry),
              },
              output: {
                // Configure the output filenames so they appear in the same folder
                // - content-scripts/some-script/index.<hash>.js
                // - content-scripts/some-script/index.<hash>.css
                entryFileNames: `[name].js`,
                assetFileNames: `${outputDir}[name].[ext]`,
              },
            },
          },
        },
        pluginOptions.scriptViteConfig ?? {}
      );
      addConfig(scriptConfig);
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
    if (htmlEntries.length > 0) addHtmlConfig(htmlEntries);

    // Sandbox - multi-page-mode
    const sandboxEntries = createEntryList([manifest.sandbox?.pages]);
    if (sandboxEntries.length > 0) addHtmlConfig(sandboxEntries);

    // Every Background Script gets it's own config
    const backgroundScripts = createEntryList([
      manifest.background?.service_worker,
      manifest.background?.page,
      manifest.background?.scripts,
    ]);
    backgroundScripts?.forEach(addScriptConfig);

    // Every Content Script gets it's own config
    manifest.content_scripts?.forEach((cs: Manifest.ContentScript) => {
      const csEntries = createEntryList([cs.js, cs.css]);
      csEntries.forEach(addScriptConfig);
    });

    // Each additional script gets it's own config
    additionalScriptInputs?.forEach(addScriptConfig);

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

  function separateAdditionalInputs(additionalInputs: string[]) {
    const additionalScriptInputs: string[] = [];
    const additionalHtmlInputs: string[] = [];
    additionalInputs?.forEach((additionalInput) => {
      if (additionalInput.endsWith("html"))
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

  function printSummary(
    rootDir: string,
    buildConfigs: Vite.InlineConfig[]
  ): void {
    if (buildConfigs.length === 0) return;

    const lines = ["", `${BOLD}Build Steps${RESET}`];
    buildConfigs.forEach((config, i) => {
      if (config.build?.rollupOptions?.input == null) return;

      const relativePaths = getInputAbsPaths(
        config.build.rollupOptions.input
      ).map((absPath) => path.relative(rootDir, absPath));

      if (relativePaths.length === 1) {
        lines.push(
          `  ${i + 1}. Building ${colorizeFilename(
            relativePaths[0]
          )} indvidually`
        );
      } else {
        lines.push(
          `  ${i + 1}. Bunding ${relativePaths.length} entrpyoints together:`
        );
        relativePaths.forEach((relativePath) =>
          lines.push(`    ${DIM}•${RESET} ${colorizeFilename(relativePath)}`)
        );
      }
    });

    logger.log(lines.join("\n"));
  }

  function printCompleted() {
    logger.log(`\n${GREEN}✓${RESET} All steps completed.\n`);
  }

  return {
    async rebuild(rebuildOptions) {
      const { rootDir, mode } = rebuildOptions;
      await Promise.all(activeWatchers.map((watcher) => watcher.close()));
      activeWatchers = [];

      const buildConfigs = await generateBuildConfigs(rebuildOptions);
      if (pluginOptions.printSummary) printSummary(rootDir, buildConfigs);

      // Print configs deep enough to include rollup inputs
      logger.verbose("Final configs: " + inspect(buildConfigs, undefined, 7));

      const newBundles: Array<OutputChunk | OutputAsset> = [];
      for (const config of buildConfigs) {
        const output = await Vite.build(config);
        if (Array.isArray(output)) {
          newBundles.push(...output.map((o) => o.output).flat());
        } else if ("output" in output) {
          newBundles.push(...output.output);
        } else {
          // In watch mode, wait until it's built once
          // @ts-expect-error: Rollup/Vite type conflict
          activeWatchers.push(output);
          await new Promise<void>((res, rej) => {
            output.addListener("event", (e) => {
              switch (e.code) {
                case "BUNDLE_END":
                  res();
                  break;
                case "ERROR":
                  rej(e.error);
                  break;
              }
            });
          });
        }
      }
      bundles = uniqBy(newBundles, "fileName");
      // This prints before the manifest plugin continues in build mode
      if (mode === BuildMode.BUILD) {
        printCompleted();
      }
    },
    getBundles() {
      return bundles;
    },
  };
}
