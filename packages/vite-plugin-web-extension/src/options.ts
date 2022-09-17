import { InlineConfig } from "vite";

export type Manifest = any;

export interface PluginOptions {
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
  browser?: string;

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
  htmlViteConfig?: InlineConfig;

  /**
   * Custom vite config to be merged with when building script inputs (background scripts/service
   * worker, content scripts, etc)
   */
  scriptViteConfig?: InlineConfig;
}

export interface InternalPluginOptions {
  manifest: string | (() => Manifest) | (() => Promise<Manifest>);
  additionalInputs: string[];
  disableAutoLaunch: boolean;
  watchFilePaths: string[];
  browser?: string;
  skipManifestValidation: boolean;
  printSummary: boolean;
  htmlViteConfig?: InlineConfig;
  scriptViteConfig?: InlineConfig;
  verbose: boolean;
  disableColors: boolean;
}
