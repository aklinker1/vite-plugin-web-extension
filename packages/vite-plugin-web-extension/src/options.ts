import { UserConfigExport } from "vite";

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

  /**
   * Custom vite config to be merged with the required lib mode configuration when building content
   * scripts or the background script
   */
  scriptViteConfig?: UserConfigExport;
}
