import { OutputAsset, OutputChunk, RollupWatcher } from "rollup";
import { inspect } from "util";
import * as Vite from "vite";
import { InternalPluginOptions } from "../options";
import { labeledStepPlugin } from "../plugins/labeled-step-plugin";
import { BuildMode } from "./BuildMode";
import {
  DISABLE_DEV_PLUGIN_NAME,
  HMR_PLUGIN_NAME,
  MANIFEST_LOADER_PLUGIN_NAME,
} from "../utils/constants";
import { colorizeFilename } from "../utils/filenames";
import { BOLD, DIM, Logger, RESET, GREEN } from "../utils/logger";
import path from "node:path";
import { getInputAbsPaths } from "../utils/paths";
import { removePlugins } from "../utils/removePlugins";
import uniqBy from "lodash.uniqby";
import { createMultibuildCompleteManager } from "../plugins/multibuild-complete-plugin";
import { bundleTrackerPlugin } from "../plugins/bundle-tracker-plugin";
import { getViteConfigsForInputs } from "./getViteConfigsForInputs";
import { hmrRewritePlugin } from "../plugins/hmr-rewrite-plugin";

interface RebuildOptions {
  rootDir: string;
  outDir: string;
  userConfig: Vite.UserConfig;
  resolvedConfig: Vite.ResolvedConfig;
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

  async function getBuildConfigs({
    rootDir,
    userConfig,
    manifest,
    onSuccess,
    mode,
    outDir,
    resolvedConfig,
  }: RebuildOptions) {
    const entryConfigs = await getViteConfigsForInputs({
      rootDir,
      outDir,
      manifest,
      mode,
      additionalInputs: pluginOptions.additionalInputs,
      baseHtmlViteConfig: pluginOptions.htmlViteConfig ?? {},
      baseSandboxViteConfig: {},
      baseScriptViteConfig: pluginOptions.scriptViteConfig ?? {},
      baseOtherViteConfig: {},
    });
    const multibuildManager = createMultibuildCompleteManager(async () => {
      // This prints before the manifest plugin continues in watch mode
      if (mode == BuildMode.WATCH) printCompleted();
      await onSuccess?.();
    });
    const totalEntries = entryConfigs.count;
    const getForcedConfig = (buildOrderIndex: number) => ({
      // We shouldn't clear the screen for these internal builds
      clearScreen: false,
      // Don't copy static assets for the lib builds - already done during manifest build
      publicDir: false,
      // Don't empty the outDir, this is handled in the parent, manifest build process
      build: { emptyOutDir: false },
      plugins: [
        // Print a message before starting each step
        labeledStepPlugin({
          logger,
          total: totalEntries,
          index: buildOrderIndex,
          mode,
        }),
        // ...(mode === BuildMode.WATCH ? [multibuildManager.plugin()] : []),
        multibuildManager.plugin(),
        hmrRewritePlugin({
          logger,
          server: resolvedConfig.server,
          hmr:
            typeof resolvedConfig.server.hmr === "object"
              ? resolvedConfig.server.hmr
              : undefined,
        }),
      ],
    });
    const finalConfigs = entryConfigs.all
      .map<Vite.InlineConfig>((entryConfig, i) =>
        Vite.mergeConfig(
          Vite.mergeConfig(entryConfig, userConfig),
          getForcedConfig(i)
        )
      )
      // Exclude some top level plugins inherited from the base config
      .map((config) =>
        removePlugins(config, [
          MANIFEST_LOADER_PLUGIN_NAME,
          DISABLE_DEV_PLUGIN_NAME,
        ])
      );
    return finalConfigs;
  }

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

  function waitForWatchBuildComplete(watcher: RollupWatcher) {
    return new Promise<void>((res, rej) => {
      watcher.addListener("event", async (e) => {
        switch (e.code) {
          case "END":
            res();
            break;
          case "ERROR":
            rej(e.error);
            break;
        }
      });
    });
  }

  return {
    async rebuild(rebuildOptions) {
      const { rootDir, mode } = rebuildOptions;
      await Promise.all(activeWatchers.map((watcher) => watcher.close()));
      activeWatchers = [];

      const buildConfigs = await getBuildConfigs(rebuildOptions);
      if (pluginOptions.printSummary) printSummary(rootDir, buildConfigs);

      // Print configs deep enough to include rollup inputs
      logger.verbose("Final configs: " + inspect(buildConfigs, undefined, 7));

      const newBundles: Array<OutputChunk | OutputAsset> = [];
      for (const config of buildConfigs) {
        const bundleTracker = bundleTrackerPlugin();
        (config.plugins ??= []).push(bundleTracker);

        const output = await Vite.build(config);
        if ("addListener" in output) {
          activeWatchers.push(output);
          // In watch mode, wait until it's built once
          await waitForWatchBuildComplete(output);
        }

        const chunks = bundleTracker.getChunks() ?? [];
        newBundles.push(...chunks);
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
