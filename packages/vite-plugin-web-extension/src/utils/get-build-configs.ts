import { ConfigEnv, mergeConfig, UserConfig } from "vite";
import { PluginOptions } from "../options";
import { Logger } from "./logger";
import { manifestWriter } from "../plugins/manifest-writer";
import { compact } from "./arrays";
import { entryFilenameToOutput } from "./filenames";
import { Manifest } from "webextension-polyfill";
import { InputOption } from "rollup";

const GENERATED_PREFIX = "generated:";

export interface ParseManifestOptions {
  baseConfig: UserConfig;
  env: ConfigEnv;
  pluginOptions: PluginOptions;
  logger: Logger;
}

export async function getBuildConfigs(options: {
  baseConfig: UserConfig;
  env: ConfigEnv;
  pluginOptions: PluginOptions;
  logger: Logger;
}): Promise<UserConfig[]> {
  const { pluginOptions, baseConfig } = options;
  const { plugin: manifestWriterPlugin, loadManifest } =
    manifestWriter(options);
  const manifest = await loadManifest();

  const configs: UserConfig[] = [];
  const addConfig = (newConfig: UserConfig) =>
    configs.push(mergeConfig(baseConfig, newConfig, true));

  const alreadyBuilt: Record<string, boolean> = {};
  const addLibModeConfig = (entry: string) => {
    if (alreadyBuilt[entry]) return;
    alreadyBuilt[entry] = true;

    const newConfig: UserConfig = {
      clearScreen: false,
      // Don't copy static assets for the lib builds - already done during multi-page builds
      publicDir: false,
      build: {
        // Exclude <root>/index.html from inputs
        rollupOptions: {},
        emptyOutDir: false,
        lib: {
          name: entry.replace(/-/g, "_").toLowerCase(),
          entry: entry,
          formats: ["umd"],
          fileName: () => entryFilenameToOutput(entry),
        },
      },
    };
    addConfig(mergeConfig(newConfig, pluginOptions.libModeViteConfig ?? {}));
  };

  const { additionalHtmlInputs, additionalScriptInputs } =
    separateAdditionalInputs(pluginOptions.additionalInputs);

  // HTML Pages - multi-page-mode
  const htmlEntries = createEntryList([
    manifest.action?.default_popup,
    manifest.devtools_page,
    manifest.options_page,
    manifest.options_ui?.page,
    manifest.browser_action?.default_popup,
    manifest.page_action?.default_popup,
    manifest.sidebar_action?.default_panel,
    additionalHtmlInputs,
  ]);
  if (htmlEntries.length > 0)
    addConfig({
      build: {
        rollupOptions: {
          input: entriesToInputs(htmlEntries),
        },
      },
    });

  // Sandbox - multi-page-mode
  const sandboxEntries = createEntryList([manifest.sandbox?.pages]);
  if (sandboxEntries.length > 0)
    addConfig({
      build: {
        rollupOptions: {
          input: entriesToInputs(sandboxEntries),
        },
      },
    });

  // Every Background Script gets it's own config
  const backgroundScripts = createEntryList([
    manifest.background?.service_worker,
    manifest.background?.page,
    manifest.background?.scripts,
  ]);
  backgroundScripts?.forEach(addLibModeConfig);

  // Every Content Script gets it's own config
  manifest.content_scripts?.forEach((cs: Manifest.ContentScript) => {
    const csEntries = createEntryList([cs.js, cs.css]);
    csEntries.forEach(addLibModeConfig);
  });

  // Each additional script gets it's own config
  additionalScriptInputs?.forEach(addLibModeConfig);

  return configs;
}

function createEntryList(
  a: Array<string | string[] | undefined> | undefined
): string[] {
  return compact<string>(a?.flat() ?? []).filter(
    (entry) => !entry.startsWith(GENERATED_PREFIX)
  );
}

function entriesToInputs(entries: string[]): InputOption {
  return entries.reduce<Record<string, string>>((input, entry) => {
    if (!entry.startsWith(GENERATED_PREFIX))
      input[entry] = entryFilenameToOutput(entry);
    return input;
  }, {});
}

function separateAdditionalInputs(additionalInputs?: string[]) {
  const additionalScriptInputs: string[] = [];
  const additionalHtmlInputs: string[] = [];
  additionalInputs?.forEach((additionalInput) => {
    if (entryFilenameToOutput(additionalInput).endsWith("html"))
      additionalHtmlInputs.push(additionalInput);
    else additionalScriptInputs.push(additionalInput);
  });
  return { additionalScriptInputs, additionalHtmlInputs };
}
