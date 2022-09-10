import { InlineConfig, UserConfigExport } from "vite";

export type Manifest = any;

export interface PluginOptions {
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
   * Whether or not to print the summary block showing what files are being used as entry-points
   *
   * @default true
   */
  printSummary?: boolean;

  /**
   * Custom vite config to be merged with when building html inputs (popup, options, sandbox, etc)
   */
  htmlViteConfig?: InlineConfig;

  /**
   * Custom vite config to be merged with when building script inputs (background scripts/service
   * worker, content scripts, etc)
   */
  scriptViteConfig?: InlineConfig;
}
