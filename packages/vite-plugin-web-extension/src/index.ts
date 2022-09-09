import { ConfigEnv, Plugin, UserConfig } from "vite";
import { PluginOptions } from "./options";
import { createLogger } from "./utils/logger";
import { PLUGIN_NAME } from "./utils/constants";
import { BuildMode } from "./utils/build-mode";
import { createBuildContext } from "./utils/build-context";
import { defineNoRollupInput } from "./utils/no-rollup-input";
import path from "node:path";
import fs from "node:fs/promises";
import { resolveBrowserTagsInObject } from "./utils/resolve-browser-flags";
import { inspect } from "node:util";
import { mergeConfigs } from "./utils/merge-configs";
import { getOutDir, getRootDir } from "./utils/paths";

/**
 * This plugin composes multiple Vite builds together into a single Vite build by calling the
 * `Vite.build` JS API inside the original build.
 *
 * The plugin itself configures just the manifest to be transformed and it starts the "build
 * context", where the rest of the build is performed.
 */
export default function browserExtension(options: PluginOptions): Plugin {
  const noInput = defineNoRollupInput();
  const logger = createLogger(options.verbose);
  /**
   * Whether the dev server is running, we're in watch mode, or it's a simple build.
   */
  let mode = BuildMode.BUILD;
  const ctx = createBuildContext({ logger, pluginOptions: options });
  /**
   * This stores the config passed in by the user from their `vite.config.ts`
   */
  let baseConfig: UserConfig;

  /**
   * Set the build mode based on how vite was ran/configured.
   */
  function configureBuildMode(config: UserConfig, env: ConfigEnv) {
    if (env.command === "serve") {
      logger.verbose("Dev mode");
      mode = BuildMode.DEV;
    } else if (config.build?.watch) {
      logger.verbose("Watch mode");
      mode = BuildMode.WATCH;
    } else {
      logger.verbose("Build mode");
      mode = BuildMode.BUILD;
    }
  }

  //#region Parsing Manifest
  /**
   * Loads the manifest.json with it's browser template tags resolved, and the real source file
   * extensions
   */
  async function loadManifest(): Promise<any> {
    let manifestTemplate: any;
    if (typeof options.manifest === "function") {
      logger.verbose("Loading manifest from function");
      manifestTemplate = options.manifest();
    } else {
      // Manifest string should be a path relative to the config.root
      const root = getRootDir(baseConfig);
      const manifestPath = path.resolve(root, options.manifest);
      logger.verbose(
        `Loading manifest from file @ ${manifestPath} (root: ${root})`
      );
      const text = await fs.readFile(manifestPath, "utf-8");
      manifestTemplate = JSON.parse(text);
    }
    logger.verbose("Manifest template: " + inspect(manifestTemplate));
    const entrypointsManifest = options.browser
      ? resolveBrowserTagsInObject(options.browser, manifestTemplate)
      : manifestTemplate;
    logger.verbose(
      "Manifest with entrypoints: " + inspect(entrypointsManifest)
    );
    return entrypointsManifest;
  }
  //#endregion

  return {
    name: PLUGIN_NAME,
    async config(config, env) {
      if (options.browser != null) {
        logger.log(`Building for browser: ${options.browser}`);
      }
      configureBuildMode(config, env);
      baseConfig = config;

      return mergeConfigs(
        // We only want to output the manifest.json, so we don't need an input.
        noInput.config,
        // Don't empty the out directory automatically, if allowed, it clears all the outputs from
        // the build context. Instead, we do it manually in `onBuildStart`
        { build: { emptyOutDir: false } }
      );
    },
    // Runs during: Build, dev, watch
    async buildStart(buildOptions) {
      if (baseConfig.build?.emptyOutDir) {
        logger.verbose("Removing build.outDir...");
        await fs.rm(getOutDir(baseConfig), { recursive: true, force: true });
      }

      // Build
      const entrypointsManifest = await loadManifest();
      await ctx.rebuild(baseConfig, entrypointsManifest, mode);
      process.stdout.write("\n");
      const bundle = ctx.getBundle();

      // Generate the manifest based on the output files
      console.log(bundle);
      const manifest = entrypointsManifest;
      this.emitFile({
        type: "asset",
        source: JSON.stringify(manifest),
        fileName: "manifest.json",
        name: "manifest.json",
      });
    },
    // Runs during: build, dev, watch
    resolveId(id) {
      return noInput.resolveId(id);
    },
    // Runs during: build, dev, watch
    load(id) {
      return noInput.load(id);
    },
    // Runs during: build, watch
    buildEnd() {},
    // Runs during: build, watch
    closeBundle() {},
    // Runs during: build, watch
    generateBundle(options, bundle, isWrite) {
      noInput.cleanupBundle(bundle);
    },
    // Runs during: dev
    handleHotUpdate(ctx) {},
  };
}
