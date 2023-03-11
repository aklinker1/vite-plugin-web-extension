import * as vite from "vite";
import { ResolvedOptions, Manifest, ProjectPaths } from "../options";
import { createLogger } from "../logger";
import { MANIFEST_LOADER_PLUGIN_NAME } from "../constants";
import { BuildMode } from "../build/BuildMode";
import { createBuildContext } from "../build/build-context";
import {
  defineNoRollupInput,
  resolveBrowserTagsInObject,
  getOutDir,
  getPublicDir,
  getRootDir,
  colorizeFilename,
} from "../utils";
import path from "node:path";
import fs from "fs-extra";
import { inspect } from "node:util";
import { createWebExtRunner, ExtensionRunner } from "../extension-runner";
import { createManifestValidator } from "../manifest-validation";
import { ContentSecurityPolicy } from "../csp";
import { renderManifest } from "../build/renderManifest";

/**
 * This plugin composes multiple Vite builds together into a single Vite build by calling the
 * `Vite.build` JS API inside the original build.
 *
 * The plugin itself configures just the manifest to be transformed and it starts the "build
 * context", where the rest of the build is performed.
 */
export function manifestLoaderPlugin(options: ResolvedOptions): vite.Plugin {
  const noInput = defineNoRollupInput();
  const logger = createLogger(options.verbose, options.disableColors);
  const ctx = createBuildContext({ logger, pluginOptions: options });
  const validateManifest = createManifestValidator({ logger });

  let mode = BuildMode.BUILD;
  let userConfig: vite.UserConfig;
  let resolvedConfig: vite.ResolvedConfig;
  let extensionRunner: ExtensionRunner;
  let paths: ProjectPaths;
  let isError = false;

  /**
   * Set the build mode based on how vite was ran/configured.
   */
  function configureBuildMode(config: vite.UserConfig, env: vite.ConfigEnv) {
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

  /**
   * Loads the manifest.json with it's browser template tags resolved, and the real source file
   * extensions
   */
  async function loadManifest(): Promise<Manifest> {
    let manifestTemplate: Manifest;
    if (typeof options.manifest === "function") {
      logger.verbose("Loading manifest from function");
      manifestTemplate = await options.manifest();
    } else {
      // Manifest string should be a path relative to the config.root
      const manifestPath = path.resolve(paths.rootDir, options.manifest);
      logger.verbose(
        `Loading manifest from file @ ${manifestPath} (root: ${paths.rootDir})`
      );
      manifestTemplate = await fs.readJson(manifestPath);
    }
    logger.verbose(
      "Manifest template: " + inspect(manifestTemplate, undefined, 5)
    );

    const resolvedManifest = resolveBrowserTagsInObject(
      options.browser ?? "chrome",
      manifestTemplate
    );
    logger.verbose("Manifest with entrypoints: " + inspect(resolvedManifest));
    return resolvedManifest;
  }

  async function openBrowser() {
    logger.log("\nOpening browser...");
    extensionRunner = createWebExtRunner({
      pluginOptions: options,
      paths,
      logger,
    });
    await extensionRunner.openBrowser();
    logger.log("Done!");
  }

  return {
    name: MANIFEST_LOADER_PLUGIN_NAME,

    // Runs during: Build, dev, watch
    async config(config, env) {
      if (options.browser != null) {
        logger.verbose(`Building for browser: ${options.browser}`);
      }
      configureBuildMode(config, env);
      userConfig = config;

      return vite.mergeConfig(
        {
          server: {
            // Set the server origin so assets contain the entire url in dev mode, not just the
            // absolute path. See #79
            origin: "http://127.0.0.1:5173",
          },
          build: {
            // Since this plugin schedules multiple builds, we can't let any of the builds empty the
            // outDir. Instead, the plugin cleans up the outDir manually in `onBuildStart`
            emptyOutDir: false,
          },
        },
        // We only want to output the manifest.json, so we don't need an input.
        noInput.config
      );
    },

    // Runs during: Build, dev, watch
    configResolved(config) {
      resolvedConfig = config;
      paths = {
        rootDir: getRootDir(config),
        outDir: getOutDir(config),
        publicDir: getPublicDir(config),
      };
    },

    // Runs during: Build, dev, watch
    async buildStart() {
      // Empty out directory
      if (resolvedConfig.build.emptyOutDir) {
        logger.verbose("Removing build.outDir...");
        await fs.rm(getOutDir(resolvedConfig), {
          recursive: true,
          force: true,
        });
      }

      // Add watch files that trigger a full rebuild
      options.watchFilePaths.forEach((file) => this.addWatchFile(file));
      if (typeof options.manifest === "string") {
        this.addWatchFile(path.resolve(paths.rootDir, options.manifest));
      }

      // Build
      const manifestWithInputs = await loadManifest();
      await ctx.rebuild({
        paths,
        userConfig,
        resolvedConfig,
        manifest: manifestWithInputs,
        mode,
        onSuccess: async () => {
          if (extensionRunner) await extensionRunner.reload();
        },
      });

      // Generate the manifest based on the output files
      const finalManifest = renderManifest(
        manifestWithInputs,
        ctx.getBundles()
      );

      // Add permissions and CSP for the dev server
      if (mode === BuildMode.DEV) {
        applyDevServerCsp(finalManifest);
      }

      if (!options.skipManifestValidation) {
        await validateManifest(finalManifest);
      }
      if (mode !== BuildMode.DEV) {
        this.emitFile({
          type: "asset",
          source: JSON.stringify(finalManifest),
          fileName: "manifest.json",
          name: "manifest.json",
        });
      } else {
        logger.log(
          "\nWriting \x1b[95mmanifest.json\x1b[0m before starting dev server..."
        );
        await fs.writeFile(
          path.resolve(paths.outDir, "manifest.json"),
          JSON.stringify(finalManifest),
          "utf8"
        );
      }

      await copyPublicDirToOutDir({ mode, paths });

      // In dev mode, open up the browser immediately after the build context is finished with the
      // first build.
      if (mode === BuildMode.DEV) {
        await openBrowser();
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
    buildEnd(err) {
      isError = err != null;
    },

    // Runs during: build, watch
    async closeBundle() {
      if (isError || mode === BuildMode.BUILD || options.disableAutoLaunch) {
        return;
      }

      await openBrowser();
    },

    // Runs during: build, watch
    generateBundle(_, bundle) {
      noInput.cleanupBundle(bundle);
    },

    // Runs during: watch
    async watchChange(id) {
      const relativePath = path.relative(paths.rootDir, id);
      logger.log(
        `\n${colorizeFilename(relativePath)} changed, restarting browser`
      );
      await extensionRunner?.exit();
    },
  };
}

/**
 * Manually copy the public directory at the start of the build during dev/watch mode - vite does
 * this for us in build mode.
 */
async function copyPublicDirToOutDir({
  mode,
  paths,
}: {
  mode: BuildMode;
  paths: ProjectPaths;
}) {
  if (
    mode === BuildMode.BUILD ||
    !paths.publicDir ||
    !(await fs.pathExists(paths.publicDir))
  ) {
    return;
  }

  await fs.copy(paths.publicDir, paths.outDir);
}

async function applyDevServerCsp(manifest: Manifest) {
  manifest.permissions ??= [];
  manifest.permissions.push("http://localhost/*");

  const csp = new ContentSecurityPolicy(
    manifest.manifest_version === 3
      ? manifest.content_security_policy?.extension_pages ??
        "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';" // default CSP for MV3
      : manifest.content_security_policy ??
        "script-src 'self'; object-src 'self';" // default CSP for MV2
  );
  csp.add("script-src", "http://localhost:*", "http://127.0.0.1:*");

  if (manifest.manifest_version === 3) {
    manifest.content_security_policy ??= {};
    manifest.content_security_policy.extension_pages = csp.toString();
  } else {
    manifest.content_security_policy = csp.toString();
  }
}
