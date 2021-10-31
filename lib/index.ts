import path from "path";
import { defineConfig, Plugin, mergeConfig } from "vite";
import { readdirSync, lstatSync, readFileSync } from "fs";

type Manifest = any;

interface BrowserExtensionPluginOptions {
  /**
   * A function that returns your manifest as a JS object. It's a function so that the manifest can
   * be updated on hot reload!
   *
   * @example
   * () => require("./path/to/manifest.json")
   */
  manifest: (() => Manifest) | (() => Promise<Manifest>);

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
}

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
      : options.manifest;
  }

  function transformManifestInputs(manifestWithTs: any): {
    transformedManifest: any;
    generatedInputs: Record<string, string>;
    styleAssets: string[];
  } {
    const generatedInputs: Record<string, string> = {};
    const transformedManifest = JSON.parse(JSON.stringify(manifestWithTs));
    const styleAssets: string[] = [];

    const filenameToInput = (filename: string) =>
      filename.substring(0, filename.lastIndexOf("."));

    const filenameToPath = (filename: string) =>
      path.resolve(moduleRoot, filename);

    const filenameToCompiledFilename = (filename: string) =>
      filename.replace(/.(ts)$/, ".js").replace(/.(scss)$/, ".css");

    const transformHtml = (manifestKey: string, htmlKey: string) => {
      const filename = transformedManifest[manifestKey]?.[htmlKey];
      if (filename == null) return;
      generatedInputs[filenameToInput(filename)] = filenameToPath(filename);
    };

    const transformScripts = (object: any, key: string) => {
      const value = object?.[key];
      if (value == null) return;
      const scripts: string[] = typeof value === "string" ? [value] : value;
      const compiledScripts: string[] = [];
      scripts.forEach((script) => {
        generatedInputs[filenameToInput(script)] = filenameToPath(script);
        compiledScripts.push(filenameToCompiledFilename(script));
      });
      object[key] = compiledScripts;
    };

    const transformStylesheets = (object: any, key: string) => {
      const value = object?.[key];
      if (value == null) return;
      const styles: string[] = typeof value === "string" ? [value] : value;
      const compiledAssets: string[] = [];
      styles.forEach((style) => {
        if (style.startsWith("generated:")) {
          log("Skipping generated asset:", style);
          return;
        }
        styleAssets.push(style);
        compiledAssets.push(filenameToCompiledFilename(style));
      });
      object[key] = compiledAssets;
    };

    const scriptExtensions = [".ts", ".js"];
    const additionalInputTypes = options.additionalInputs?.reduce(
      (mapping, input) => {
        if (scriptExtensions.find((ext) => input.endsWith(ext))) {
          mapping.scripts.push(input);
        } else {
          mapping.assets.push(input);
        }
        return mapping;
      },
      {
        scripts: [] as string[],
        assets: [] as string[],
      }
    );

    // Html inputs
    transformHtml("browser_action", "default_popup");
    transformHtml("page_action", "default_popup");
    transformHtml("options_ui", "page");
    transformHtml("background", "page");
    transformHtml("sidebar_action", "default_panel");

    // JS inputs
    transformScripts(transformedManifest.background, "scripts");
    transformedManifest.content_scripts.forEach((contentScript: string) => {
      transformScripts(contentScript, "js");
    });
    transformScripts(transformedManifest.user_scripts, "api_script");
    transformScripts(additionalInputTypes, "scripts");

    // CSS inputs
    transformedManifest.content_scripts.forEach((contentScript: string) => {
      transformStylesheets(contentScript, "css");
    });
    transformStylesheets(additionalInputTypes, "assets");

    return {
      generatedInputs,
      transformedManifest,
      styleAssets,
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

  let moduleRoot: string;

  return {
    name: "web-ext-manifest",

    config(viteConfig) {
      const webExtConfig = defineConfig({
        build: {
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
      return mergeConfig(webExtConfig, viteConfig, true);
    },

    configResolved(viteConfig) {
      moduleRoot = viteConfig.root;
    },

    async buildStart(rollupOptions) {
      // Generate manifest
      const manifestWithTs = await getManifest();
      log("Generated manifest:", manifestWithTs);

      // Generate inputs
      const { transformedManifest, generatedInputs, styleAssets } =
        transformManifestInputs(manifestWithTs);
      rollupOptions.input = {
        ...rollupOptions.input,
        ...generatedInputs,
      };

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
    },
  };
}
