import * as rollup from "rollup";
import { inspect } from "util";
import * as vite from "vite";
import { ProjectPaths, ResolvedOptions } from "../options";
import { labeledStepPlugin } from "../plugins/labeled-step-plugin";
import { BuildMode } from "./BuildMode";
import { MANIFEST_LOADER_PLUGIN_NAME } from "../constants";
import { colorizeFilename, getInputPaths, removePlugin } from "../utils";
import { BOLD, DIM, Logger, RESET, GREEN } from "../logger";
import { createMultibuildCompleteManager } from "../plugins/multibuild-complete-plugin";
import { bundleTrackerPlugin } from "../plugins/bundle-tracker-plugin";
import { getViteConfigsForInputs } from "./getViteConfigsForInputs";
import { BundleMap } from "./renderManifest";

interface RebuildOptions {
  paths: ProjectPaths;
  userConfig: vite.UserConfig;
  manifest: any;
  mode: BuildMode;
  server?: vite.ViteDevServer;
  onSuccess?: () => Promise<void> | void;
  viteMode: string;
}

export interface BuildContext {
  /**
   * Based on the user config and new manifest, rebuild all the entrypoints and update the bundle
   * map.
   */
  rebuild(rebuildOptions: RebuildOptions): Promise<void>;
  getBundles(): BundleMap;
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
  let bundles: BundleMap = {};
  let activeWatchers: rollup.RollupWatcher[] = [];

  async function getBuildConfigs({
    paths,
    userConfig,
    manifest,
    server,
    onSuccess,
    mode,
    viteMode,
  }: RebuildOptions) {
    const entryConfigs = getViteConfigsForInputs({
      paths,
      manifest,
      mode,
      logger,
      server,
      additionalInputs: pluginOptions.additionalInputs,
      baseHtmlViteConfig: pluginOptions.htmlViteConfig ?? {},
      baseSandboxViteConfig: {},
      baseScriptViteConfig: pluginOptions.scriptViteConfig ?? {},
      baseOtherViteConfig: {},
      viteMode,
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
      // Don't empty the outDir, this is handled in the parent build process
      build: { emptyOutDir: false },
      plugins: [
        labeledStepPlugin(logger, totalEntries, buildOrderIndex, paths),
        multibuildManager.plugin(),
      ],
    });

    const finalConfigPromises: Promise<vite.InlineConfig>[] =
      entryConfigs.all.map(async (config, i) => {
        return vite.mergeConfig(config, getForcedConfig(i));
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
      const input = config.build?.rollupOptions?.input ?? config.build?.lib;
      if (!input) return;

      const inputs = getInputPaths(paths, input);
      if (inputs.length === 1) {
        lines.push(
          `  ${i + 1}. Building ${colorizeFilename(inputs[0])} indvidually`
        );
      } else {
        lines.push(
          `  ${i + 1}. Bundling ${inputs.length} entrypoints together:`
        );
        inputs.forEach((relativePath) =>
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
      watcher.on("event", async (e) => {
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

      for (const config of buildConfigs) {
        const bundleTracker = bundleTrackerPlugin();
        (config.plugins ??= []).push(bundleTracker);

        const output = await vite.build(config);
        if ("on" in output) {
          activeWatchers.push(output);
          // In watch mode, wait until it's built once
          await waitForWatchBuildComplete(output);
        }

        // Save the bundle chunks
        const input = config.build?.lib ?? config.build?.rollupOptions?.input;
        if (input) {
          const chunks = bundleTracker.getChunks() ?? [];
          for (const file of getInputPaths(paths, input)) {
            bundles[file] = chunks;
          }
        }
      }
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
