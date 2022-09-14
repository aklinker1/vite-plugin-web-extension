import { ConfigEnv, Plugin, ResolvedConfig, UserConfig } from "vite";
import { InternalPluginOptions } from "../options";
import { createLogger } from "../utils/logger";
import { PLUGIN_NAME } from "../utils/constants";
import { BuildMode } from "../utils/build-mode";
import { createBuildContext } from "../utils/build-context";
import { defineNoRollupInput } from "../utils/no-rollup-input";
import path from "node:path";
import fs from "fs-extra";
import { resolveBrowserTagsInObject } from "../utils/resolve-browser-flags";
import { inspect } from "node:util";
import { mergeConfigs } from "../utils/merge-configs";
import { getOutDir, getPublicDir, getRootDir } from "../utils/paths";
import { OutputAsset, OutputChunk } from "rollup";
import type { Manifest } from "webextension-polyfill";
import { startWebExt, ExtensionRunner } from "../utils/extension-runner";
import { createManifestValidator } from "../utils/manifest-validation";

/**
 * This plugin composes multiple Vite builds together into a single Vite build by calling the
 * `Vite.build` JS API inside the original build.
 *
 * The plugin itself configures just the manifest to be transformed and it starts the "build
 * context", where the rest of the build is performed.
 */
export function manifestLoaderPlugin(options: InternalPluginOptions): Plugin {
  const noInput = defineNoRollupInput();
  const logger = createLogger(options.verbose, options.disableColors);
  /**
   * Whether the dev server is running, we're in watch mode, or it's a simple build.
   */
  let mode = BuildMode.BUILD;
  const ctx = createBuildContext({ logger, pluginOptions: options });
  /**
   * This stores the config passed in by the user from their `vite.config.ts`. This is the config
   * used as a base for all the builds performed by the build context.
   */
  let userConfig: UserConfig;
  /**
   * This stores the final, resolved config with lots of defaults and additional information filled
   * out by Vite. Used to find paths related to the build process.
   */
  let resolvedConfig: ResolvedConfig;
  let extensionRunner: ExtensionRunner;
  const validateManifest = createManifestValidator({ logger });
  let rootDir: string;
  let outDir: string;
  let publicDir: string | undefined;

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

  //#region Manifest
  /**
   * Loads the manifest.json with it's browser template tags resolved, and the real source file
   * extensions
   */
  async function loadManifest(): Promise<any> {
    let manifestTemplate: any;
    const manifestOption = options.manifest ?? "manifest.json";
    if (typeof manifestOption === "function") {
      logger.verbose("Loading manifest from function");
      manifestTemplate = manifestOption();
    } else {
      // Manifest string should be a path relative to the config.root
      const manifestPath = path.resolve(rootDir, manifestOption);
      logger.verbose(
        `Loading manifest from file @ ${manifestPath} (root: ${rootDir})`
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

  function renderManifest(
    manifest: any,
    bundles: Array<OutputChunk | OutputAsset>
  ): any {
    const findReplacement = (entry: string) =>
      bundles.find((output) => {
        if (
          output.type === "chunk" &&
          output.isEntry &&
          // JS files show up instead of the HTML file, so this prevents an HTML replacement from
          // being a JS file
          !output.facadeModuleId?.endsWith(".html")
        ) {
          return output.facadeModuleId?.endsWith(entry);
        }
        return output.name === entry || output.fileName === entry;
      });
    const replaceFieldWithOutput = (
      parentObject: any | undefined,
      key: any,
      onGeneratedFile: (outputPath: string) => void = () => {}
    ) => {
      const sourcePath = parentObject?.[key];
      if (!sourcePath) return;
      const replacement = findReplacement(sourcePath);
      if (!replacement?.fileName) return;
      parentObject[key] = replacement.fileName;
      if (replacement.type === "chunk") {
        // @ts-ignore
        const metadata = replacement.viteMetadata as {
          importedAssets: Set<string>;
          importedCss: Set<string>;
        };
        if (
          metadata == null ||
          metadata.importedAssets == null ||
          metadata.importedCss == null
        ) {
          throw Error(
            "Vite internal API has changed and broke this plugin. Please submit an issue to github with your Vite version."
          );
        }
        metadata.importedAssets.forEach(onGeneratedFile);
        metadata.importedCss.forEach(onGeneratedFile);
      }
    };
    const replaceArrayWithOutput = (
      parentArray: string[] | undefined,
      onGeneratedFile: (outputPath: string) => void = () => {}
    ): void => {
      if (!parentArray) return;
      for (let i = 0; i < parentArray.length; i++) {
        replaceFieldWithOutput(parentArray, i, onGeneratedFile);
      }
    };

    replaceFieldWithOutput(manifest.action, "default_popup");
    replaceFieldWithOutput(manifest, "devtools_page");
    replaceFieldWithOutput(manifest, "options_page");
    replaceFieldWithOutput(manifest.options_ui, "page");
    replaceFieldWithOutput(manifest.browser_action, "default_popup");
    replaceFieldWithOutput(manifest.page_action, "default_popup");
    replaceFieldWithOutput(manifest.sidebar_action, "default_panel");
    replaceArrayWithOutput(manifest.sandbox?.pages);
    replaceFieldWithOutput(manifest.background, "service_worker");
    replaceFieldWithOutput(manifest.background, "page");
    replaceArrayWithOutput(manifest.background?.scripts);

    manifest?.content_scripts?.forEach((cs: Manifest.ContentScript) => {
      replaceArrayWithOutput(cs?.js, (generatedFile) => {
        if (!generatedFile.endsWith(".css")) return;
        cs.css ??= [];
        cs.css.push(generatedFile);
      });
      replaceArrayWithOutput(cs?.css);
    });

    return manifest;
  }
  //#endregion

  return {
    name: PLUGIN_NAME,
    async config(config, env) {
      if (options.browser != null) {
        logger.log(`Building for browser: ${options.browser}`);
      }
      configureBuildMode(config, env);
      userConfig = config;

      return mergeConfigs(
        // We only want to output the manifest.json, so we don't need an input.
        noInput.config,
        // Don't empty the out directory automatically, if allowed, it clears all the outputs from
        // the build context. Instead, we do it manually in `onBuildStart`
        { build: { emptyOutDir: false } }
      );
    },
    configResolved(config) {
      resolvedConfig = config;
      rootDir = getRootDir(config);
      outDir = getOutDir(config);
      publicDir = getPublicDir(config);
    },
    // Runs during: Build, dev, watch
    async buildStart(buildOptions) {
      if (resolvedConfig.build.emptyOutDir) {
        logger.verbose("Removing build.outDir...");
        await fs.rm(getOutDir(resolvedConfig), {
          recursive: true,
          force: true,
        });
      }

      // Build
      const entrypointsManifest = await loadManifest();
      await ctx.rebuild({
        rootDir,
        userConfig,
        manifest: entrypointsManifest,
        mode,
      });

      // Generate the manifest based on the output files
      const manifest = renderManifest(entrypointsManifest, ctx.getBundles());
      if (!options.skipManifestValidation) await validateManifest(manifest);
      this.emitFile({
        type: "asset",
        source: JSON.stringify(manifest),
        fileName: "manifest.json",
        name: "manifest.json",
      });

      // Manually copy the public directory when necessary
      if (publicDir && (mode === BuildMode.WATCH || mode === BuildMode.DEV)) {
        const outputDir = getOutDir(resolvedConfig);
        fs.copy(publicDir, outputDir);
      }
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
    async closeBundle() {
      if (mode === BuildMode.WATCH && !options.disableAutoLaunch) {
        await extensionRunner?.exit();
        extensionRunner = await startWebExt({
          pluginOptions: options,
          rootDir,
          outDir,
          logger,
        });
      }
    },
    // Runs during: build, watch
    generateBundle(options, bundle, isWrite) {
      noInput.cleanupBundle(bundle);
    },
    // Runs during: dev
    handleHotUpdate(ctx) {},
  };
}
