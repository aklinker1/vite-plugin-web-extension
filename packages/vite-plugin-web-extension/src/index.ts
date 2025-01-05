import * as vite from "vite";
import { ResolvedOptions, UserOptions } from "./options";
import { manifestLoaderPlugin } from "./plugins/manifest-loader-plugin";
import fs from "fs-extra";

export { UserOptions as PluginOptions };

export default function webExtension(
  options: UserOptions = {}
): vite.PluginOption {
  // Prevent recursively applying the `webExtension` plugin, see #59 and #105
  if (process.env.VITE_PLUGIN_WEB_EXTENSION_CHILD_BUILD === "true") {
    return [];
  }

  const internalOptions: ResolvedOptions = {
    additionalInputs: options.additionalInputs ?? [],
    disableAutoLaunch: options.disableAutoLaunch ?? false,
    manifest: options.manifest ?? "manifest.json",
    printSummary: options.printSummary ?? true,
    skipManifestValidation: options.skipManifestValidation ?? false,
    watchFilePaths: options.watchFilePaths ?? [],
    browser: options.browser,
    htmlViteConfig: options.htmlViteConfig,
    scriptViteConfig: options.scriptViteConfig,
    transformManifest: options.transformManifest,
    webExtConfig: options.webExtConfig,
    bundleInfoJsonPath: options.bundleInfoJsonPath,
    onBundleReady: options.onBundleReady,
    verbose: process.argv.includes("-d") || process.argv.includes("--debug"),
    disableColors:
      process.env.CI === "true" || process.env.DISABLE_COLORS === "true", // TODO: document env var
  };

  return manifestLoaderPlugin(internalOptions);
}

/**
 * Helper function for `JSON.parse(fs.readFileSync(..., "utf-8"))`.
 */
export function readJsonFile(file: string): any {
  return fs.readJsonSync(file);
}
