import { PluginOption } from "vite";
import { InternalPluginOptions, PluginOptions } from "./options";
import { manifestLoaderPlugin } from "./plugins/manifest-loader-plugin";
import fs from "fs-extra";
import { hmrPlugin } from "./plugins/hmr-plugin";

export { PluginOptions };

export default function webExtension(
  options: PluginOptions = {}
): PluginOption {
  const internalOptions: InternalPluginOptions = {
    additionalInputs: options.additionalInputs ?? [],
    disableAutoLaunch: options.disableAutoLaunch ?? false,
    manifest: options.manifest ?? "manifest.json",
    printSummary: options.printSummary ?? true,
    skipManifestValidation: options.skipManifestValidation ?? false,
    watchFilePaths: options.watchFilePaths ?? [],
    browser: options.browser,
    htmlViteConfig: options.htmlViteConfig,
    scriptViteConfig: options.scriptViteConfig,
    verbose: process.argv.includes("-d") || process.argv.includes("--debug"),
    disableColors:
      process.env.CI === "true" || process.env.DISABLE_COLORS === "true", // TODO: document env var
  };

  // return manifestLoaderPlugin(internalOptions);
  return [manifestLoaderPlugin(internalOptions), hmrPlugin()];
}

/**
 * Helper function for `JSON.parse(fs.readFileSync(..., "utf-8"))`.
 */
export function readJsonFile(file: string): any {
  return fs.readJsonSync(file);
}
