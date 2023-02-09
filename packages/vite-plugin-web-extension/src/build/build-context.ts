import * as rollup from "rollup";
import { inspect } from "util";
import * as vite from "vite";
import { ProjectPaths, ResolvedOptions } from "../options";
import { labeledStepPlugin } from "../plugins/labeled-step-plugin";
import { BuildMode } from "./BuildMode";
import { MANIFEST_LOADER_PLUGIN_NAME } from "../constants";
import { colorizeFilename, getInputAbsPaths, removePlugin } from "../utils";
import { BOLD, DIM, Logger, RESET, GREEN } from "../logger";
import path from "node:path";
import uniqBy from "lodash.uniqby";
import { createMultibuildCompleteManager } from "../plugins/multibuild-complete-plugin";
import { bundleTrackerPlugin } from "../plugins/bundle-tracker-plugin";
import { getViteConfigsForInputs } from "./getViteConfigsForInputs";
import { hmrRewritePlugin } from "../plugins/hmr-rewrite-plugin";

interface RebuildOptions {
  paths: ProjectPaths;
  userConfig: vite.UserConfig;
  resolvedConfig: vite.ResolvedConfig;
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
  getBundles(): Array<rollup.OutputChunk | rollup.OutputAsset>;
}

/**
 * Keeps track of everything that needs to be build for the extension, and orchastraits the actual
 * building of each part of the extension.
 */
export function createBuildContext({
  pluginOptions,
  logger,
}: {
  pluginOptions: ResolvedOptions;
  logger: Logger;
}): BuildContext {
  /**
   * Tracks an each input path relative to the Vite root, to their output filename and a list of
   * generated assets.
   */
  let bundles: Array<rollup.OutputChunk | rollup.OutputAsset> = [];
  let activeWatchers: rollup.RollupWatcher[] = [];

  async function getBuildConfigs({
    paths,
    userConfig,
    resolvedConfig,
    manifest,
    onSuccess,
    mode,
  }: RebuildOptions) {
    const entryConfigs = await getViteConfigsForInputs({
      paths,
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
      // Don't empty the outDir, this is handled in the parent build process
      build: { emptyOutDir: false },
      // Don't discover any vite.config.ts files in the root, all relevant config is already
      // passed down. Allowing discovery can cause a infinite loop where the plugins are applied
      // over and over again. See <https://github.com/aklinker1/vite-plugin-web-extension/issues/56>
      configFile: false,
      plugins: [
        labeledStepPlugin(logger, totalEntries, buildOrderIndex, paths),
        multibuildManager.plugin(),
        hmrRewritePlugin({
          server: resolvedConfig.server,
          hmr:
            typeof resolvedConfig.server.hmr === "object"
              ? resolvedConfig.server.hmr
              : undefined,
          paths,
          logger,
        }),
      ],
    });
    const finalConfigPromises = entryConfigs.all
      .map<vite.InlineConfig>((entryConfig, i) =>
        vite.mergeConfig(
          vite.mergeConfig(entryConfig, userConfig),
          getForcedConfig(i)
        )
      )
      // Exclude this plugin from child builds to break recursion
      .map(async (config): Promise<vite.InlineConfig> => {
        const newPlugins = await removePlugin(
          config.plugins,
          MANIFEST_LOADER_PLUGIN_NAME
        );
        return { ...config, plugins: newPlugins };
      });
    return await Promise.all(finalConfigPromises);
  }

  function printSummary(
    paths: ProjectPaths,
    buildConfigs: vite.InlineConfig[]
  ): void {
    if (buildConfigs.length === 0) return;

    const lines = ["", `${BOLD}Build Steps${RESET}`];
    buildConfigs.forEach((config, i) => {
      if (config.build?.rollupOptions?.input == null) return;

      const relativePaths = getInputAbsPaths(
        config.build.rollupOptions.input
      ).map((absPath) => path.relative(paths.rootDir, absPath));

      if (relativePaths.length === 1) {
        lines.push(
          `  ${i + 1}. Building ${colorizeFilename(
            relativePaths[0]
          )} indvidually`
        );
      } else {
        lines.push(
          `  ${i + 1}. Bunding ${relativePaths.length} entrypoints together:`
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

  function waitForWatchBuildComplete(watcher: rollup.RollupWatcher) {
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
      const { paths, mode } = rebuildOptions;
      await Promise.all(activeWatchers.map((watcher) => watcher.close()));
      activeWatchers = [];

      const buildConfigs = await getBuildConfigs(rebuildOptions);
      if (pluginOptions.printSummary) printSummary(paths, buildConfigs);

      // Print configs deep enough to include rollup inputs
      logger.verbose("Final configs: " + inspect(buildConfigs, undefined, 7));

      const newBundles: Array<rollup.OutputChunk | rollup.OutputAsset> = [];
      for (const config of buildConfigs) {
        const bundleTracker = bundleTrackerPlugin();
        (config.plugins ??= []).push(bundleTracker);

        const output = await vite.build(config);
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
