import path from "path";
import { defineConfig, Plugin, mergeConfig, UserConfig } from "vite";
import { readdirSync, lstatSync, readFileSync } from "fs";
const webExt = require("web-ext");
import { buildScript, BuildScriptConfig } from "./src/build-script";
import { resolveBrowserTagsInObject } from "./src/resolve-browser-flags";
import { validateManifest } from "./src/validation";
import { HookWaiter } from "./src/hook-waiter";

type Manifest = any;

interface BrowserExtensionPluginOptions {
  /**
   * The path to your manifest.json or a  function that returns your manifest as a JS object. It's a
   * function that returns a generated or dynamic javascript object representing the manifest
   *
   * @example
   * () => readJsonFile("./path/to/manifest.json")
   */
  manifest: string | (() => Manifest) | (() => Promise<Manifest>);

  /**
   * This path is where the manifest will be written to, and it is relative to Vite's output path
   * (default: `"manifest.json"`)
   */
  writeManifestTo?: string;

  /**
   * A path relative to Vite's root where all the extensions static assets can be found
   *
   * @example
   * "src/assets"
   */
  assets: string;

  /**
   * A path relative to the output directory (default: `"assets"`). All the files from the `assets`
   */
  writeAssetsTo?: string;

  /**
   * Whether or not to show logs. This is useful when modules aren't resolving and you need to debug
   * your paths
   */
  verbose?: boolean;

  /**
   * Used to include additional files, like content scripts, not mentioned in the final
   * `manifest.json`. Paths should be relative to Vite's `root` (or `process.cwd()` if not set)
   */
  additionalInputs?: string[];

  /**
   * See [`web-ext` docs](https://github.com/mozilla/web-ext#using-web-ext-in-nodejs-code) for options to configure how `web-ext` runs
   */
  webExtConfig?: any;

  /**
   * **Absolute paths** to files to watch.
   */
  watchFilePaths?: string[];

  /**
   * The browser to target, defaulting to chrome.
   */
  browser?: string;

  /**
   * Do not validate your manifest to make sure it can be loaded by browsers
   */
  skipManifestValidation?: boolean;

  /**
   * How the `background.service_worker` is built. This setting does nothing if you don't have a
   * service worker.
   *
   * - If it's `"module"`, the service worker is treated as apart of the initial multi-page build, and
   * you should set `background.module` to `true`.
   * - If it's `"standalone"`, the service worker will be treated as an `additionalInput` and be
   * bundled in an individual build process.
   *
   * @default "module"
   *
   * It can be useful to switch to `"standalone"` when there are issues with your chunks, like
   * `window` being used when it's not available in a service worker
   */
  serviceWorkerType?: "module" | "standalone";
}

type BuildScriptCache = Omit<BuildScriptConfig, "vite" | "watch">;

export default function browserExtension<T>(
  options: BrowserExtensionPluginOptions
): Plugin {
  function log(...args: any[]) {
    process.stdout.write("\x1b[0m\x1b[2m");
    if (options?.verbose)
      console.log("[vite-plugin-web-ext-manifest]", ...args);
    process.stdout.write("\x1b[0m");
  }

  async function getManifest(): Promise<Manifest> {
    return typeof options.manifest === "function"
      ? options.manifest()
      : readJsonFile(options.manifest);
  }

  function transformManifestInputs(manifestWithTs: any): {
    transformedManifest: any;
    generatedInputs: Record<string, string>;
    styleAssets: string[];
    generatedScriptInputs: BuildScriptCache[];
  } {
    const inputIncludedMap: Record<string, boolean> = {};
    const generatedInputs: Record<string, string> = {};
    const generatedScriptInputs: BuildScriptCache[] = [];
    const transformedManifest = JSON.parse(JSON.stringify(manifestWithTs));
    const styleAssets = new Set<string>();

    const filenameToInput = (filename: string) =>
      filename.substring(0, filename.lastIndexOf("."));

    const filenameToPath = (filename: string) =>
      path.resolve(moduleRoot, filename);

    const filenameToCompiledFilename = (filename: string) =>
      filename.replace(/.(ts)$/, ".js").replace(/.(scss)$/, ".css");

    const transformHtml = (...manifestPath: string[]) => {
      const filename = manifestPath.reduce(
        (parent, path) => parent?.[path],
        transformedManifest
      );
      if (filename == null) return;
      generatedInputs[filenameToInput(filename)] = filenameToPath(filename);
    };

    const transformSandboxedHtml = (filename: string) => {
      generatedScriptInputs.push({
        inputAbsPath: filenameToPath(filename),
        outputRelPath: filenameToInput(filename),
      });
    };

    const transformScripts = (object: any, key: string) => {
      const value = object?.[key];
      if (value == null) return;
      const isSingleString = typeof value === "string";
      const scripts: string[] = isSingleString ? [value] : value;
      const compiledScripts: string[] = [];
      scripts.forEach((script) => {
        if (!inputIncludedMap[script]) {
          generatedScriptInputs.push({
            inputAbsPath: filenameToPath(script),
            outputRelPath: filenameToInput(script),
          });
        }
        compiledScripts.push(filenameToCompiledFilename(script));
        inputIncludedMap[script] = true;
      });

      if (isSingleString) object[key] = compiledScripts[0];
      else object[key] = compiledScripts;
    };

    const transformModule = (object: any, key: string) => {
      const input = object?.[key];
      if (input == null) return;
      generatedInputs[filenameToInput(input)] = filenameToPath(input);
      object[key] = filenameToCompiledFilename(input);
    };

    const transformStylesheets = (object: any, key: string) => {
      const value = object?.[key];
      if (value == null) return;
      const styles: string[] = typeof value === "string" ? [value] : value;
      const onManifest: string[] = [];
      styles.forEach((style) => {
        if (style.startsWith("generated:")) {
          log("Skip generated asset:", style);
          onManifest.push(
            filenameToCompiledFilename(style).replace("generated:", "")
          );
        } else {
          styleAssets.add(style);
          onManifest.push(filenameToCompiledFilename(style));
        }
      });
      object[key] = onManifest;
    };

    const htmlExtensions = [".html"];
    const scriptExtensions = [".ts", ".js"];
    const additionalInputTypes = options.additionalInputs?.reduce(
      (mapping, input) => {
        if (htmlExtensions.find((ext) => input.endsWith(ext))) {
          mapping.html.push(input);
        } else if (scriptExtensions.find((ext) => input.endsWith(ext))) {
          mapping.scripts.push(input);
        } else {
          mapping.assets.push(input);
        }
        return mapping;
      },
      {
        html: [] as string[],
        scripts: [] as string[],
        assets: [] as string[],
      }
    );

    // Html inputs
    transformHtml("browser_action", "default_popup");
    transformHtml("page_action", "default_popup");
    transformHtml("action", "default_popup");
    transformHtml("options_page");
    transformHtml("options_ui", "page");
    transformHtml("background", "page");
    transformHtml("sidebar_action", "default_panel");
    additionalInputTypes?.html.forEach((filename) => {
      generatedInputs[filenameToInput(filename)] = filenameToPath(filename);
    });
    transformedManifest.sandbox?.pages?.forEach(transformSandboxedHtml);

    // JS inputs
    transformScripts(transformedManifest.background, "scripts");
    if (options.serviceWorkerType === "standalone")
      transformScripts(transformedManifest.background, "service_worker");
    else transformModule(transformedManifest.background, "service_worker");
    transformedManifest.content_scripts?.forEach((contentScript: string) => {
      transformScripts(contentScript, "js");
    });
    transformScripts(transformedManifest.user_scripts, "api_script");
    transformScripts(additionalInputTypes, "scripts");

    // CSS inputs
    transformedManifest.content_scripts?.forEach((contentScript: string) => {
      transformStylesheets(contentScript, "css");
    });
    transformStylesheets(additionalInputTypes, "assets");

    return {
      generatedInputs,
      transformedManifest,
      generatedScriptInputs,
      styleAssets: Array.from(styleAssets.values()),
    };
  }

  function getAllAssets(): string[] {
    const queue = [options.assets];
    log("Searching for assets in:", options.assets);
    const assets: string[] = [];
    while (queue.length > 0) {
      const folderName = queue.shift()!;
      const folderPath = path.resolve(moduleRoot, folderName);
      const children = readdirSync(folderPath).map((filename) =>
        path.join(folderName, filename)
      );
      for (const childName of children) {
        const childPath = path.resolve(moduleRoot, childName);
        if (lstatSync(childPath).isFile()) {
          log(`  > ${childName}`);
          assets.push(childName);
        } else {
          queue.push(childName);
        }
      }
    }
    return assets;
  }

  const browser = options.browser ?? "chrome";
  let outDir: string;
  let moduleRoot: string;
  let webExtRunner: any;
  let isWatching: boolean;
  let finalConfig: UserConfig;
  let scriptInputs: BuildScriptCache[] | undefined;
  let hasBuiltOnce = false;
  const hookWaiter = new HookWaiter("closeBundle");
  let isError = false;

  return {
    name: "vite-plugin-web-extension",

    config(viteConfig) {
      if (!hasBuiltOnce) {
      }
      const isFirstBuild = !hasBuiltOnce;
      const extensionConfig = defineConfig({
        build: {
          emptyOutDir: isFirstBuild && viteConfig.build?.emptyOutDir,
          terserOptions: {
            // As per chrome policy
            mangle: false,
          },
          rollupOptions: {
            output: {
              // Remove hashes from output filenames for consistent builds
              entryFileNames: "[name].js",
              chunkFileNames: "[name].js",
              assetFileNames: "[name].[ext]",
            },
          },
        },
      });
      finalConfig = mergeConfig(extensionConfig, viteConfig, true);
      return finalConfig;
    },

    configResolved(viteConfig) {
      log("Building for browser:", browser);
      moduleRoot = viteConfig.root;
      outDir = viteConfig.build.outDir;
      isWatching = viteConfig.inlineConfig.build?.watch === true;
    },

    async buildStart(rollupOptions) {
      isError = false;
      try {
        // Generate manifest
        const manifestWithBrowserTags = await getManifest();
        log(
          "Manifest before browser transform:",
          JSON.stringify(manifestWithBrowserTags, null, 2)
        );
        const manifestWithTs = resolveBrowserTagsInObject(
          browser,
          manifestWithBrowserTags
        );
        log(
          "Manifest after browser transform:",
          JSON.stringify(manifestWithTs, null, 2)
        );

        if (!options.skipManifestValidation)
          await validateManifest(log, manifestWithTs);

        // Generate inputs
        const {
          transformedManifest,
          generatedInputs,
          generatedScriptInputs,
          styleAssets,
        } = transformManifestInputs(manifestWithTs);

        rollupOptions.input = {
          ...rollupOptions.input,
          ...generatedInputs,
        };
        scriptInputs = generatedScriptInputs;

        // Assets
        const assets = [...styleAssets, ...getAllAssets()];
        assets.forEach((asset) => {
          this.emitFile({
            type: "asset",
            fileName: asset,
            source: readFileSync(path.resolve(moduleRoot, asset)),
          });
        });

        // Ignore vite's default of looking for a <root>/index.html
        // @ts-expect-error: doesn't want me to delete
        delete rollupOptions.input["0"];

        // Add stuff to the bundle
        const manifestContent = JSON.stringify(transformedManifest, null, 2);
        this.emitFile({
          type: "asset",
          fileName: options?.writeManifestTo ?? "manifest.json",
          name: "manifest.json",
          source: manifestContent,
        });
        log("Final manifest:", manifestContent);
        log("Final rollup inputs:", rollupOptions.input);

        if (isWatching) {
          options.watchFilePaths?.forEach((file) => this.addWatchFile(file));
          assets.forEach((asset) =>
            this.addWatchFile(path.resolve(moduleRoot, asset))
          );
        }
      } catch (err) {
        isError = true;
        throw err;
      }
    },

    async buildEnd(err) {
      if (err != null) {
        log("Skipping script builds because of error", err);
        return;
      }
    },

    async closeBundle() {
      if (isError) return;

      if (!hasBuiltOnce) {
        for (const input of scriptInputs ?? []) {
          log(
            "Building in lib mode:",
            path.relative(process.cwd(), input.inputAbsPath)
          );
          await buildScript(
            {
              ...input,
              vite: finalConfig,
              watch: isWatching,
            },
            hookWaiter
          );
        }
      }
      await hookWaiter.waitForAll();

      if (!isWatching) return;

      if (webExtRunner == null) {
        const config = {
          target:
            options.browser === null || options.browser === "firefox"
              ? null
              : "chromium",
          ...options.webExtConfig,
          // No touch - can't exit the terminal if these are changed, so they cannot be overridden
          sourceDir: outDir,
          noReload: false,
          noInput: true,
        };
        log("Passed web-ext run config:", options.webExtConfig);
        log("Final web-ext run config:", config);
        // https://github.com/mozilla/web-ext#using-web-ext-in-nodejs-code
        webExtRunner = await webExt.cmd.run(config, {
          shouldExitProgram: true,
        });
      } else {
        webExtRunner.reloadAllExtensions();
      }

      hasBuiltOnce = true;
    },
  };
}

export function readJsonFile(absolutePath: string) {
  return JSON.parse(readFileSync(absolutePath, { encoding: "utf-8" }));
}
