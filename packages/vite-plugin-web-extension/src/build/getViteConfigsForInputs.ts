import path from "node:path";
import * as vite from "vite";
import type browser from "webextension-polyfill";
import { Logger } from "../logger";
import { ProjectPaths, Manifest } from "../options";
import { hmrRewritePlugin } from "../plugins/hmr-rewrite-plugin";
import { compact, trimExtension } from "../utils";
import { BuildMode } from "./BuildMode";

const HTML_ENTRY_REGEX = /\.(html)$/;
const SCRIPT_ENTRY_REGEX = /\.(js|ts|mjs|mts)$/;
const CSS_ENTRY_REGEX = /\.(css|scss|sass|less|stylus)$/;

class CombinedViteConfigs {
  /**
   * A single config that builds all the HTML pages.
   */
  html?: vite.InlineConfig;
  /**
   * A single config that builds all the HTML pages for sandbox. These are separate from `html`
   * because we want to properly tree-shake out any browser API usages, since those APIs aren't
   * available in sandbox pages.
   */
  sandbox?: vite.InlineConfig;
  /**
   * All other JS inputs from the manifest and additional inputs are separated into their own
   * configs.
   *
   * Unlike tsup, Vite cannot be given multiple entry-points, and produce individual bundles for
   * each entrypoint. Vite can only produce code-split outputs that share other files, which
   * extensions cannot consume. So we build each of these separately.
   */
  scripts?: vite.InlineConfig[];
  /**
   * CSS files cannot be built with vite 5 as the input to lib mode.
   */
  css?: vite.InlineConfig[];
  /**
   * Similar to scripts, but for other file "types". Sometimes CSS, SCSS, JSON, images, etc, can be
   * passed into Vite directly. The most common case of this in extensions are CSS files listed for
   * content scripts.
   */
  other?: vite.InlineConfig[];

  /**
   * The total number of configs required to build the extension.
   */
  get count(): number {
    return this.all.length;
  }

  /**
   * Return all the configs as an array.
   */
  get all(): vite.InlineConfig[] {
    return compact(
      [this.html, this.sandbox, this.scripts, this.css, this.other].flat()
    );
  }

  applyBaseConfig(baseConfig: vite.InlineConfig) {
    if (this.html) this.html = vite.mergeConfig(baseConfig, this.html);
    if (this.sandbox) this.sandbox = vite.mergeConfig(baseConfig, this.sandbox);
    this.scripts = this.scripts?.map((config) =>
      vite.mergeConfig(baseConfig, config)
    );
    this.css = this.css?.map((config) => vite.mergeConfig(baseConfig, config));
    this.other = this.other?.map((config) =>
      vite.mergeConfig(baseConfig, config)
    );
  }
}

/**
 * Given an input `manifest.json` with source code paths and `options.additionalInputs`, return a
 * set of Vite configs that can be used to build all the entry-points for the extension.
 */
export function getViteConfigsForInputs(options: {
  paths: ProjectPaths;
  mode: BuildMode;
  additionalInputs: string[];
  manifest: Manifest;
  logger: Logger;
  server?: vite.ViteDevServer;
  baseHtmlViteConfig: vite.InlineConfig;
  baseSandboxViteConfig: vite.InlineConfig;
  baseScriptViteConfig: vite.InlineConfig;
  baseOtherViteConfig: vite.InlineConfig;
  viteMode: string;
}): CombinedViteConfigs {
  const { paths, additionalInputs, manifest, mode, logger, server } = options;
  const configs = new CombinedViteConfigs();

  const processedInputs = new Set<string>();
  const hasBeenProcessed = (input: string) => processedInputs.has(input);

  /**
   * For a list of entry-points, build them all in multi-page mode:
   * <https://vitejs.dev/guide/build.html#multi-page-app>
   */
  function getMultiPageConfig(
    entries: string[],
    baseConfig: vite.InlineConfig
  ): vite.InlineConfig | undefined {
    const newEntries = entries.filter((entry) => !hasBeenProcessed(entry));
    newEntries.forEach((entry) => processedInputs.add(entry));

    if (newEntries.length === 0) return;

    const plugins =
      mode === BuildMode.DEV
        ? [
            hmrRewritePlugin({
              server: server!,
              paths,
              logger,
            }),
          ]
        : [];

    const inputConfig: vite.InlineConfig = {
      plugins,
      build: {
        rollupOptions: {
          input: newEntries.reduce<Record<string, string>>((input, entry) => {
            input[trimExtension(entry)] = path.resolve(paths.rootDir, entry);
            return input;
          }, {}),
          output: {
            // Configure the output filenames so they appear in the same folder
            // - popup/index.html
            // - popup/index.js
            entryFileNames: `[name].js`,
            chunkFileNames: `[name].js`,
            /**
             * [name] for assetFileNames is either the filename or whole path. So if you
             * have two `index.html` files in different directories, they would overwrite each
             * other as `dist/index.css`.
             *
             * See [#47](https://github.com/aklinker1/vite-plugin-web-extension/issues/47) for
             * more details.
             */
            assetFileNames: ({ name }) => {
              if (!name) return "[name].[ext]";

              if (name && path.isAbsolute(name)) {
                name = path.relative(paths.rootDir, name);
              }
              return `${trimExtension(name)}.[ext]`;
            },
          },
        },
      },
    };
    return vite.mergeConfig(baseConfig, inputConfig);
  }

  /**
   * For a given entry-point, get the vite config use to bundle it into a single file.
   */
  function getIndividualConfig(
    entry: string,
    baseConfig: vite.InlineConfig
  ): vite.InlineConfig | undefined {
    if (hasBeenProcessed(entry)) return;
    processedInputs.add(entry);

    /**
     * "content-scripts/some-script/index" -> "content-scripts/some-script/"
     * "some-script" -> ""
     */
    const moduleId = trimExtension(entry);
    const inputConfig: vite.InlineConfig = {
      build: {
        watch: mode !== BuildMode.BUILD ? {} : undefined,
        lib: {
          name: "_",
          entry,
          formats: ["iife"],
          fileName: () => moduleId + ".js",
        },
      },
      define: {
        // See https://github.com/aklinker1/vite-plugin-web-extension/issues/96
        "process.env.NODE_ENV": `"${options.viteMode}"`,
      },
    };
    return vite.mergeConfig(baseConfig, inputConfig);
  }

  function getHtmlConfig(entries: string[]): vite.InlineConfig | undefined {
    return getMultiPageConfig(entries, options.baseHtmlViteConfig);
  }
  function getSandboxConfig(entries: string[]): vite.InlineConfig | undefined {
    return getMultiPageConfig(entries, options.baseSandboxViteConfig);
  }
  function getScriptConfig(entry: string): vite.InlineConfig | undefined {
    return getIndividualConfig(entry, options.baseScriptViteConfig);
  }
  function getOtherConfig(entry: string): vite.InlineConfig | undefined {
    return getIndividualConfig(entry, options.baseOtherViteConfig);
  }
  function getCssConfig(entry: string): vite.InlineConfig | undefined {
    return getMultiPageConfig([entry], options.baseOtherViteConfig);
  }

  const {
    htmlAdditionalInputs,
    otherAdditionalInputs,
    scriptAdditionalInputs,
    cssAdditionalInputs,
  } = separateAdditionalInputs(additionalInputs);

  // HTML Pages
  const htmlEntries = simplifyEntriesList([
    manifest.action?.default_popup,
    manifest.devtools_page,
    manifest.options_page,
    manifest.options_ui?.page,
    manifest.browser_action?.default_popup,
    manifest.page_action?.default_popup,
    manifest.side_panel?.default_path,
    manifest.sidebar_action?.default_panel,
    manifest.background?.page,
    manifest.chrome_url_overrides?.bookmarks,
    manifest.chrome_url_overrides?.history,
    manifest.chrome_url_overrides?.newtab,
    manifest.chrome_settings_overrides?.homepage,
    htmlAdditionalInputs,
  ]);
  const sandboxEntries = simplifyEntriesList([manifest.sandbox?.pages]);

  configs.html = getHtmlConfig(htmlEntries);
  configs.sandbox = getSandboxConfig(sandboxEntries);

  // Scripts
  compact(
    simplifyEntriesList([
      manifest.background?.service_worker,
      manifest.background?.scripts,
      manifest.content_scripts?.flatMap(
        (cs: browser.Manifest.ContentScript) => cs.js
      ),
      scriptAdditionalInputs,
    ]).map(getScriptConfig)
  ).forEach((scriptConfig) => {
    configs.scripts ??= [];
    configs.scripts.push(scriptConfig);
  });

  // CSS
  compact(
    simplifyEntriesList([
      manifest.content_scripts?.flatMap(
        (cs: browser.Manifest.ContentScript) => cs.css
      ),
      cssAdditionalInputs,
    ]).map(getCssConfig)
  ).forEach((cssConfig) => {
    configs.css ??= [];
    configs.css.push(cssConfig);
  });

  // Other Types
  compact(
    simplifyEntriesList([otherAdditionalInputs]).map(getOtherConfig)
  ).forEach((otherConfig) => {
    configs.other ??= [];
    configs.other.push(otherConfig);
  });

  validateCombinedViteConfigs(configs);
  return configs;
}

/**
 * `options.additionalInputs` accepts html files, scripts, CSS, and other file entry-points. This
 * method breaks those apart into their related groups (html, script, CSS, other).
 */
function separateAdditionalInputs(additionalInputs: string[]) {
  const scriptAdditionalInputs: string[] = [];
  const otherAdditionalInputs: string[] = [];
  const htmlAdditionalInputs: string[] = [];
  const cssAdditionalInputs: string[] = [];

  additionalInputs?.forEach((input) => {
    if (HTML_ENTRY_REGEX.test(input)) htmlAdditionalInputs.push(input);
    else if (SCRIPT_ENTRY_REGEX.test(input)) scriptAdditionalInputs.push(input);
    else if (CSS_ENTRY_REGEX.test(input)) cssAdditionalInputs.push(input);
    else scriptAdditionalInputs.push(input);
  });

  return {
    scriptAdditionalInputs,
    otherAdditionalInputs,
    htmlAdditionalInputs,
    cssAdditionalInputs,
  };
}

/**
 * Take in a list of any combination of single entries, lists of entries, or undefined and return a
 * single, simple list of all the truthy, non-public, entry-points
 */
function simplifyEntriesList(
  a: Array<string | string[] | undefined> | undefined
): string[] {
  return compact<string>(a?.flat() ?? []).filter(
    (a) => !a.startsWith("public:")
  );
}

function validateCombinedViteConfigs(configs: CombinedViteConfigs) {
  if (configs.count === 0) {
    throw Error(
      "No inputs found in manifest.json. Run Vite with `--debug` for more details."
    );
  }
}
