import path from "path";
import {
  defineConfig,
  Plugin,
  mergeConfig,
  UserConfig,
  normalizePath,
} from "vite";
import type { EmittedFile, PluginContext } from "rollup";
import {
  readdirSync,
  rmSync,
  lstatSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
} from "fs";
const webExt = require("web-ext");
import { buildScript, BuildScriptConfig } from "./src/build-script";
import { resolveBrowserTagsInObject } from "./src/resolve-browser-flags";
import { validateManifest } from "./src/validation";
import { HookWaiter } from "./src/hook-waiter";
import { copyDirSync } from "./src/copy-dir";
import md5 from "md5";

const GENERATED_PREFIX = "generated:";

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
   * Used to disable auto-installing the extension when in watch mode. Default value is `false`.
   */
  disableAutoLaunch?: boolean;

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
   * @deprecated This field no longer has any effect. Background scripts are always built in lib
   *             mode
   *
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

  /**
   * Whether or not to print the summary block showing what files are being used as entry-points
   *
   * @default true
   */
  printSummary?: boolean;
}

type BuildScriptCache = Omit<BuildScriptConfig, "vite" | "watch">;

export default function browserExtension(
  options: BrowserExtensionPluginOptions
): Plugin {
  function log(...args: any[]) {
    process.stdout.write("\x1b[0m\x1b[2m");
    if (options?.verbose) console.log("[vite-plugin-web-extension]", ...args);
    process.stdout.write("\x1b[0m");
  }
  function info(...args: any[]) {
    console.log(
      "\x1b[0m\x1b[1m\x1b[32m[vite-plugin-web-extension]\x1b[0m",
      ...args
    );
  }
  function warn(message: string) {
    console.log(
      `\x1b[0m\x1b[1m\x1b[33m[vite-plugin-web-extension]\x1b[0m \x1b[33m${message}\x1b[0m`
    );
  }

  if (options.serviceWorkerType) {
    warn(
      "serviceWorkerType has been removed, service workers are always built in lib mode now. Remove this option"
    );
  }

  async function getManifest(): Promise<Manifest> {
    return typeof options.manifest === "function"
      ? options.manifest()
      : readJsonFile(options.manifest);
  }

  function transformManifestInputs(manifestWithTs: any): {
    transformedManifest: any;
    htmlInputs: Record<string, string>;
    assetInputs: Record<string, string>;
    generatedScriptInputs: BuildScriptCache[];
  } {
    const previouslyIncludedMap: Record<string, boolean> = {};
    const htmlInputs: Record<string, string> = {};
    const generatedScriptInputs: BuildScriptCache[] = [];
    const transformedManifest = JSON.parse(JSON.stringify(manifestWithTs));
    const assetInputs: Record<string, string> = {};

    const filenameToInput = (filename: string) =>
      filename.substring(0, filename.lastIndexOf("."));

    const filenameToPath = (filename: string) =>
      path.resolve(moduleRoot, filename);

    const filenameToCompiledFilename = (filename: string) =>
      filename
        .replace(/.(ts)$/, ".js")
        .replace(/.(scss|sass|less|stylus)$/, ".css");

    const transformHtml = (...manifestPath: string[]) => {
      const filename = manifestPath.reduce(
        (parent, path) => parent?.[path],
        transformedManifest
      );
      if (filename == null) return;
      htmlInputs[filenameToInput(filename)] = filenameToPath(filename);
    };

    const transformSandboxedHtml = (filename: string) => {
      const base = "sandbox";
      generatedScriptInputs.push({
        inputAbsPath: filenameToPath(filename),
        outputRelPath: path.join(
          base,
          filename.substring(
            filename.lastIndexOf("/") + 1,
            filename.lastIndexOf(".")
          )
        ),
        basePath: `/${base}/`,
      });
    };

    const transformScripts = (object: any, key: string) => {
      const value = object?.[key];
      if (value == null) return;
      const isSingleString = typeof value === "string";
      const scripts: string[] = isSingleString ? [value] : value;
      const compiledScripts: string[] = [];
      scripts.forEach((script) => {
        if (script.startsWith(GENERATED_PREFIX)) {
          log("Skip generated script:", script);
          compiledScripts.push(
            filenameToCompiledFilename(script).replace(GENERATED_PREFIX, "")
          );
        } else {
          if (!previouslyIncludedMap[script]) {
            generatedScriptInputs.push({
              inputAbsPath: filenameToPath(script),
              outputRelPath: filenameToInput(script),
            });
          }
          compiledScripts.push(filenameToCompiledFilename(script));
        }
        previouslyIncludedMap[script] = true;
      });

      if (isSingleString) object[key] = compiledScripts[0];
      else object[key] = compiledScripts;
    };

    const transformAssets = (object: any, key: string) => {
      const value = object?.[key];
      if (value == null) return;
      const filenames: string[] = typeof value === "string" ? [value] : value;
      const onManifest: string[] = [];
      filenames.forEach((filename) => {
        if (filename.startsWith(GENERATED_PREFIX)) {
          log("Skip generated asset:", filename);
          onManifest.push(
            filenameToCompiledFilename(filename).replace(GENERATED_PREFIX, "")
          );
        } else {
          assetInputs[filenameToInput(filename)] = filenameToPath(filename);
          onManifest.push(filenameToCompiledFilename(filename));
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
      htmlInputs[filenameToInput(filename)] = filenameToPath(filename);
    });
    transformedManifest.sandbox?.pages?.forEach(transformSandboxedHtml);

    // JS inputs
    transformScripts(transformedManifest.background, "scripts");
    transformScripts(transformedManifest.background, "service_worker");
    transformedManifest.content_scripts?.forEach((contentScript: string) => {
      transformScripts(contentScript, "js");
    });
    transformScripts(transformedManifest.user_scripts, "api_script");
    transformScripts(additionalInputTypes, "scripts");

    // CSS inputs
    transformedManifest.content_scripts?.forEach((contentScript: string) => {
      transformAssets(contentScript, "css");
    });
    transformAssets(additionalInputTypes, "assets");

    if (isDevServer) {
      transformedManifest.permissions.push("http://localhost/*");
      const CSP = "script-src 'self' http://localhost:3000; object-src 'self'";
      if (transformedManifest.content_security_policy != null) {
        // TODO: "merge" CSPs automatically
        warn(
          'Could not automatically add CSP to manifest to allow extension to run against dev server.\n\nUpdate the CSP yourself in dev mode include "http://localhost:3000" in script-src'
        );
      } else if (transformedManifest.manifest_version === 2) {
        transformedManifest.content_security_policy = CSP;
      } else if (transformedManifest.manifest_version === 3) {
        throw Error(
          "Dev server does not work for Manifest V3 because of a Chrome Bug: https://bugs.chromium.org/p/chromium/issues/detail?id=1290188\n\nUse vite build --watch instead"
        );
      }
    }

    return {
      htmlInputs,
      transformedManifest,
      generatedScriptInputs,
      assetInputs,
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

  function getPublicDir(): string | undefined {
    if (finalConfig.publicDir === false) {
      return;
    } else if (
      finalConfig.publicDir &&
      path.isAbsolute(finalConfig.publicDir)
    ) {
      return finalConfig.publicDir;
    } else {
      return path.join(moduleRoot, finalConfig.publicDir ?? "public");
    }
  }

  function copyPublicDir() {
    const publicDir = getPublicDir();
    // Don't copy anything if the public dir isn't found
    if (publicDir == null) return;
    log("publicDir:", publicDir);
    if (!existsSync(publicDir)) return;

    // Make sure it's a directory
    const info = lstatSync(publicDir);
    if (!info.isDirectory()) {
      warn(publicDir + " is not a directory, skipping");
      return;
    }

    // Copy all files over
    copyDirSync(publicDir, outDir);
  }

  async function viteBuildScripts() {
    if (!hasBuiltOnce) {
      for (const input of scriptInputs ?? []) {
        process.stdout.write("\n");
        info(
          `Building \x1b[96m${path.relative(
            process.cwd(),
            input.inputAbsPath
          )}\x1b[0m in Lib Mode`
        );
        await buildScript(
          {
            ...input,
            vite: finalConfig,
            watch: isWatching || isDevServer,
          },
          hookWaiter,
          log
        );
      }
      process.stdout.write("\n");
    }
    await hookWaiter.waitForAll();
  }

  async function launchBrowserAndInstall() {
    if (!isWatching && !isDevServer) return;
    if (disableAutoLaunch) return;

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
      log("Passed web-ext run config:", JSON.stringify(options.webExtConfig));
      log("Final web-ext run config:", JSON.stringify(config));
      // https://github.com/mozilla/web-ext#using-web-ext-in-nodejs-code
      webExtRunner = await webExt.cmd.run(config, {
        shouldExitProgram: true,
      });
    } else {
      webExtRunner.reloadAllExtensions();
      process.stdout.write("\n\n");
    }
  }

  async function onBuildEnd() {
    await viteBuildScripts();
    await launchBrowserAndInstall();
    hasBuiltOnce = true;
  }

  function pointScriptsToDevServer(
    htmlPath: string,
    htmlContent: string
  ): string {
    let newHtmlContent = htmlContent;
    const htmlFolder = path.dirname(htmlPath);
    console.log("replacing", htmlContent);
    let hasAddedViteReloader = false;
    const scriptSrcRegex =
      /(<script\s+?type="module"\s+?src="(.*?)".*?>|<script\s+?src="(.*?)"\s+?type="module".*?>)/g;
    let match: RegExpExecArray | null;
    while ((match = scriptSrcRegex.exec(htmlContent)) !== null) {
      if (match.index === scriptSrcRegex.lastIndex) {
        scriptSrcRegex.lastIndex++;
      }
      const [existingScriptTag, _, src1, src2] = match;
      const src = src1 || src2;
      console.log({ existingScriptTag, src });
      let newSrc: string;
      if (src.startsWith("/")) {
        newSrc = `http://localhost:3000${src}`;
      } else if (src.startsWith("./")) {
        newSrc = `http://localhost:3000/${normalizePath(
          path.join(htmlFolder, src.replace("./", ""))
        )}`;
      } else {
        const aliases = (finalConfig.alias ??
          finalConfig.resolve?.alias ??
          {}) as Record<string, string | undefined> | undefined;
        log("Aliases:", aliases);
        const alias = src.substring(
          0,
          src.includes("/") ? src.indexOf("/") : src.length
        );
        const matchedPath = aliases?.[alias] ?? aliases?.[alias + "/"];
        if (!matchedPath) {
          warn(
            `Failed to resolve script src alias: ${existingScriptTag}, ${src}`
          );
          newSrc = src;
        } else {
          const filePath = src.replace(alias, matchedPath);
          const relativePath = path.relative(
            finalConfig.root ?? process.cwd(),
            filePath
          );
          newSrc = `http://localhost:3000/${normalizePath(relativePath)}`;
        }
      }
      let newScriptTag = existingScriptTag.replace(src, newSrc);
      if (!hasAddedViteReloader) {
        // Add a script that watches vite and reloads when there's a change
        newScriptTag +=
          '</script>\n<script type="module" src="http://localhost:3000/@vite/client"></script>';
        hasAddedViteReloader = true;
      }
      log("Old script: " + existingScriptTag);
      log("Dev server script: " + newScriptTag);
      newHtmlContent = newHtmlContent.replace(existingScriptTag, newScriptTag);
    }
    return newHtmlContent;
  }

  let customEmitFileUnbound = function (
    this: PluginContext,
    file: EmittedFile
  ) {
    if (!isDevServer) {
      return this.emitFile(file);
    }
    if (file.type !== "asset") {
      throw Error(
        "File type not supported in dev mode " + JSON.stringify(file, null, 2)
      );
    }

    if (file.fileName == null)
      throw Error(
        "Asset filename was missing. This is an internal error, please open an issue on GitHub"
      );
    if (file.source == null)
      throw Error(
        "Asset source was missing. This is an internal error, please open an issue on GitHub"
      );

    const outFile = path.resolve(outDir, file.fileName);
    mkdirSync(path.dirname(outFile), { recursive: true });
    let content: any;
    if (file.fileName.endsWith(".html")) {
      if (typeof file.source !== "string")
        throw Error(
          "HTML not passed as string. This is an internal error, please open an issue on GitHub"
        );
      content = pointScriptsToDevServer(file.fileName, file.source);
    } else {
      content = file.source;
    }
    writeFileSync(outFile, content);
    return md5(content);
  };
  let customEmitFile: PluginContext["emitFile"];

  const browser = options.browser ?? "chrome";
  const disableAutoLaunch = options.disableAutoLaunch ?? false;
  let outDir: string;
  let moduleRoot: string;
  let webExtRunner: any;
  let isWatching: boolean;
  let finalConfig: UserConfig;
  let scriptInputs: BuildScriptCache[] | undefined;
  let hasBuiltOnce = false;
  const hookWaiter = new HookWaiter("closeBundle");
  let isError = false;
  let shouldEmptyOutDir = false;
  let isDevServer = false;

  return {
    name: "vite-plugin-web-extension",

    config(viteConfig, { command }) {
      shouldEmptyOutDir = !!viteConfig.build?.emptyOutDir;
      const port = viteConfig.server?.port ?? 3000;
      isDevServer = command === "serve";

      const extensionConfig = defineConfig({
        base: isDevServer ? `http://localhost:${port}/` : undefined,
        server: {
          port,
          hmr: {
            host: "localhost",
          },
        },
        build: {
          emptyOutDir: false,
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
      finalConfig = mergeConfig(viteConfig, extensionConfig, true);
      return finalConfig;
    },

    configResolved(viteConfig) {
      moduleRoot = viteConfig.root;
      outDir = viteConfig.build.outDir;

      isWatching = viteConfig.inlineConfig.build?.watch === true;
    },

    async buildStart(rollupOptions) {
      log("Building for browser:", browser);
      log("Building with vite config:", JSON.stringify(finalConfig, null, 2));
      isError = false;
      try {
        if (!hasBuiltOnce && shouldEmptyOutDir) {
          rmSync(outDir, { recursive: true, force: true });
        }

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
          htmlInputs: generatedInputs,
          generatedScriptInputs,
          assetInputs,
        } = transformManifestInputs(manifestWithTs);

        rollupOptions.input = { ...generatedInputs, ...assetInputs };
        scriptInputs = generatedScriptInputs;

        customEmitFile = customEmitFileUnbound.bind(this);

        // Emit modified html files in dev mode that point to localhost
        if (isDevServer) {
          Object.entries(rollupOptions.input).forEach(([name, inputPath]) => {
            customEmitFile({
              type: "asset",
              fileName: `${name}.html`,
              source: readFileSync(inputPath, "utf-8"),
            });
          });
        }

        // Assets
        const assets = getAllAssets();
        assets.forEach((asset) => {
          customEmitFile({
            type: "asset",
            fileName: asset,
            source: readFileSync(path.resolve(moduleRoot, asset)),
          });
        });

        // Copy public dir - only in watch mode because vite doesn't do it for some reason...
        if (isWatching) copyPublicDir();

        // Add stuff to the bundle
        const manifestContent = JSON.stringify(transformedManifest, null, 2);
        customEmitFile({
          type: "asset",
          fileName: options?.writeManifestTo ?? "manifest.json",
          name: "manifest.json",
          source: manifestContent,
        });
        log("Final manifest:", manifestContent);

        log("Final rollup inputs:", rollupOptions.input);

        if (options.printSummary !== false && !hasBuiltOnce) {
          const noneDisplay = "\x1b[0m\x1b[2m    • (none)\x1b[0m";
          process.stdout.write("\n");
          const summary = [""];
          summary.push("  Building HTML Pages in Multi-Page Mode:");
          summary.push(
            Object.values(rollupOptions.input)
              .map((input) => {
                const listItem = path.relative(process.cwd(), input);
                return `\x1b[0m\x1b[2m    • ${listItem}\x1b[0m`;
              })
              .join("\n") || noneDisplay
          );
          summary.push("  Building in Lib Mode:");
          summary.push(
            scriptInputs
              .map(({ inputAbsPath }) => {
                const listItem = path.relative(process.cwd(), inputAbsPath);
                return `\x1b[0m\x1b[2m    • ${listItem}\x1b[0m`;
              })
              .join("\n") || noneDisplay
          );
          info(summary.join("\n"));
        }
        process.stdout.write("\n");
        info("Building HTML Pages in Multi-Page Mode");

        if (isWatching || isDevServer) {
          options.watchFilePaths?.forEach((file) => this.addWatchFile(file));
          assets.forEach((asset) =>
            this.addWatchFile(path.resolve(moduleRoot, asset))
          );
        }

        if (isDevServer) {
          await new Promise((res) => setTimeout(res, 1000));
          await onBuildEnd();
        }
      } catch (err) {
        isError = true;
        throw err;
      }
    },

    async buildEnd(err) {
      if (err != null) {
        log("Skipping script builds because of error", err);
        isError = true;
        return;
      }
    },

    async closeBundle() {
      if (isError) return;
      await onBuildEnd();
    },
  };
}

export function readJsonFile(absolutePath: string) {
  return JSON.parse(readFileSync(absolutePath, { encoding: "utf-8" }));
}
