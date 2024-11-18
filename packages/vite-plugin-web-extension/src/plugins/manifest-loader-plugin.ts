import * as vite from "vite";
import type * as rollup from "rollup";
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

  let browserOpened = false;
  async function openBrowser() {
    logger.log("\nOpening browser...");
    extensionRunner = createWebExtRunner({
      pluginOptions: options,
      paths,
      logger,
    });
    await extensionRunner.openBrowser();
    browserOpened = true;
    logger.log("Done!");
  }

  async function buildExtension({
    emitFile,
    server,
  }: {
    emitFile: (asset: rollup.EmittedAsset) => void | Promise<void>;
    server?: vite.ViteDevServer;
  }) {
    // Build
    const manifestWithInputs = await loadManifest();
    await ctx.rebuild({
      paths,
      userConfig,
      manifest: manifestWithInputs,
      mode,
      server,
      viteMode: resolvedConfig.mode,
      onSuccess: async () => {
        await extensionRunner?.reload();
      },
    });

    // Generate the manifest based on the output files
    const renderedManifest = renderManifest(
      manifestWithInputs,
      ctx.getBundles()
    );

    const finalManifest = options.transformManifest
      ? await options.transformManifest(renderedManifest)
      : renderedManifest;

    // Add permissions and CSP for the dev server
    if (mode === BuildMode.DEV) {
      applyDevServerCsp(finalManifest);
    }

    if (!options.skipManifestValidation) {
      await validateManifest(finalManifest);
    }
    emitFile({
      type: "asset",
      source: JSON.stringify(finalManifest),
      fileName: "manifest.json",
      name: "manifest.json",
    });

    if (options.bundleInfoJsonPath) {
      emitFile({
        type: "asset",
        source: JSON.stringify(ctx.getBundles()),
        fileName: options.bundleInfoJsonPath,
      });
    }

    await copyPublicDirToOutDir({ mode, paths });

    // Handle the onBundleReady callback in dev mode here, as writeBundle is not called in dev mode
    if (mode === BuildMode.DEV && options.onBundleReady) {
      logger.verbose("Running onBundleReady");
      await options.onBundleReady();
    }

    // In dev mode, open up the browser immediately after the build context is finished with the
    // first build.
    if (mode === BuildMode.DEV && !options.disableAutoLaunch) {
      await openBrowser();
    }
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
            // absolute path. See #79. This does not effect scripts or links. They are updated
            // manually in the hmr-rewrite-plugin
            origin: "http://localhost:5173",
          },
          build: {
            // Since this plugin schedules multiple builds, we can't let any of the builds empty the
            // outDir. Instead, the plugin cleans up the outDir manually in `onBuildStart`
            emptyOutDir: false,
          },
        } as vite.InlineConfig,
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

    configureServer(server) {
      server.httpServer?.on("listening", () => {
        // In dev mode, the files have to be built AFTER the server is started so the HTML files can
        // be SSR-ed so they have the correct contents.
        if (mode === BuildMode.DEV) {
          buildExtension({
            server,
            async emitFile(asset) {
              await fs.writeFile(
                path.resolve(paths.outDir, asset.fileName ?? "unknown"),
                asset.source ?? "{}",
                "utf8"
              );
              logger.log(
                "\n\x1b[32m✓\x1b[0m Wrote \x1b[95mmanifest.json\x1b[0m"
              );
            },
          });
        }
      });
    },

    // Runs during: Build, dev, watch
    async buildStart() {
      // Empty out directory
      if (userConfig.build?.emptyOutDir) {
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

      // This is where we build the extension in build and watch mode.
      if (mode !== BuildMode.DEV) {
        await buildExtension({
          emitFile: (asset) => void this.emitFile(asset),
        });
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

    // Runs during: build, watch, dev (only when pressing ctrl+C to stop server)
    async closeBundle() {
      if (isError || mode === BuildMode.BUILD || options.disableAutoLaunch) {
        return;
      }

      // Vite4 handles SIGINT (ctrl+C) in dev mode and calls closeBundle after stopping the server.
      // So we need to manually close the open browser.
      if (mode === BuildMode.DEV) return await extensionRunner.exit();

      // This is where we open the browser in watch mode.
      await openBrowser();
    },

    // Runs during: build, watch
    generateBundle(_, bundle) {
      noInput.cleanupBundle(bundle);
    },

    // Runs during: build, watch
    async writeBundle() {
      if (options.onBundleReady) {
        logger.verbose("Running onBundleReady");
        await options.onBundleReady();
      }
    },

    // Runs during: watch, dev
    async watchChange(id) {
      if (
        // Only run this hook for `vite build --watch`, not `vite dev`
        mode === BuildMode.DEV ||
        // Don't reload if the browser isn't opened yet
        !browserOpened ||
        // Don't reload if the change was a file written to the output directory
        id.startsWith(paths.outDir)
      )
        return;

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
  // TODO: Only add if permission isn't already present
  if (manifest.manifest_version === 3) {
    manifest.host_permissions ??= [];
    manifest.host_permissions.push("http://localhost/*");
  } else {
    manifest.permissions ??= [];
    manifest.permissions.push("http://localhost/*");
  }

  const csp = new ContentSecurityPolicy(
    manifest.manifest_version === 3
      ? manifest.content_security_policy?.extension_pages ??
        "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';" // default CSP for MV3
      : manifest.content_security_policy ??
        "script-src 'self'; object-src 'self';" // default CSP for MV2
  );
  csp.add("script-src", "http://localhost:*");

  if (manifest.manifest_version === 3) {
    manifest.content_security_policy ??= {};
    manifest.content_security_policy.extension_pages = csp.toString();
  } else {
    manifest.content_security_policy = csp.toString();
  }
}
