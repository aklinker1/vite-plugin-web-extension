import * as vite from "vite";
import type * as webext from "web-ext-option-types";
import type Browser from "webextension-polyfill";

export type Manifest = any;

export type WebExtConfig = Omit<webext.RunOptions, "reload"> & {
  /**
   * @deprecated Use `firefoxBinary` instead.
   */
  firefox?: string;
}

export interface UserOptions {
  /**
   * The path to your manifest.json or a  function that returns your manifest as a JS object. It's a
   * function that returns a generated or dynamic javascript object representing the manifest
   *
   * Defaults to `"manifest.json"`
   *
   * @example
   * () => ({
   *   name: "Extension Name",
   *   manifest_version: 3,
   *   ...
   * })
   */
  manifest?: string | (() => Manifest) | (() => Promise<Manifest>) | undefined;

  /**
   * An optional transform function to modify the manifest just before the plugin writes
   * it to the output directory.
   */
  transformManifest?: (
    manifest: Browser.Manifest.WebExtensionManifest
  ) =>
    | Browser.Manifest.WebExtensionManifest
    | Promise<Browser.Manifest.WebExtensionManifest>;

  /**
   * Used to include additional files, like content scripts, not mentioned in the final
   * `manifest.json`. Paths should be relative to Vite's `root` (or `process.cwd()` if not set)
   */
  additionalInputs?: string[];

  /**
   * Used to disable auto-installing the extension when in watch mode. Default value is `false`.
   */
  disableAutoLaunch?: boolean;

  /**
   * Absolute path or relative path to the Vite root to files to watch. When these files change, a
   * full reload of the extension is triggered in both watch and dev mode.
   *
   * If your manifest is generated from a function, you can add all the files that generate it here
   * so the browser restarts when you make a change.
   */
  watchFilePaths?: string[];

  /**
   * The browser to target and open.
   *
   * @default "chrome"
   */
  browser?: 'chrome' | 'firefox' | (string & {}) | null;

  /**
   * Do not validate your manifest to make sure it can be loaded by browsers.
   *
   * @default false
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
  htmlViteConfig?: vite.InlineConfig;

  /**
   * Custom vite config to be merged with when building script inputs (background scripts/service
   * worker, content scripts, etc)
   */
  scriptViteConfig?: vite.InlineConfig;

  /**
   * Optional startup configuration for web-ext. For list of options, see
   * <https://github.com/mozilla/web-ext/blob/666886f40a967b515d43cf38fc9aec67ad744d89/src/program.js#L559>.
   */
  webExtConfig?: WebExtConfig;

  /**
   * Output path to a JSON file containing information about the generated bundles.
   */
  bundleInfoJsonPath?: string;

  /**
   * Action to be executed after build ends.
   */
  onBundleReady?: () => void | Promise<void>;
}

/**
 * Same as `UserOptions`, but most optional fields are now required.
 */
export interface ResolvedOptions {
  manifest: string | (() => Manifest) | (() => Promise<Manifest>);
  transformManifest?: (
    manifest: Browser.Manifest.WebExtensionManifest
  ) =>
    | Browser.Manifest.WebExtensionManifest
    | Promise<Browser.Manifest.WebExtensionManifest>;
  additionalInputs: string[];
  disableAutoLaunch: boolean;
  watchFilePaths: string[];
  browser?: 'chrome' | 'firefox' | (string & {}) | null;
  skipManifestValidation: boolean;
  printSummary: boolean;
  htmlViteConfig?: vite.InlineConfig;
  scriptViteConfig?: vite.InlineConfig;
  verbose: boolean;
  disableColors: boolean;
  webExtConfig?: WebExtConfig;
  bundleInfoJsonPath?: string;
  onBundleReady?: () => void | Promise<void>;
}

/**
 * An object storing all the paths used by vite and this plugin.
 */
export interface ProjectPaths {
  outDir: string;
  publicDir?: string;
  rootDir: string;
}
