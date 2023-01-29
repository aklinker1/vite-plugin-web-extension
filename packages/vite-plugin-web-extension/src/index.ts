import * as vite from "vite";
import { ResolvedOptions, UserOptions } from "./options";
import { manifestLoaderPlugin } from "./plugins/manifest-loader-plugin";
import fs from "fs-extra";
import { disableDevPlugin } from "./plugins/disable-dev-plugin";

export { UserOptions as PluginOptions };

export default function webExtension(
  options: UserOptions = {}
): vite.PluginOption {
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
    verbose: process.argv.includes("-d") || process.argv.includes("--debug"),
    disableColors:
      process.env.CI === "true" || process.env.DISABLE_COLORS === "true", // TODO: document env var
  };

  // return manifestLoaderPlugin(internalOptions);
  return [manifestLoaderPlugin(internalOptions), disableDevPlugin()];
}

/**
 * Helper function for `JSON.parse(fs.readFileSync(..., "utf-8"))`.
 */
export function readJsonFile(file: string): any {
  return fs.readJsonSync(file);
}
