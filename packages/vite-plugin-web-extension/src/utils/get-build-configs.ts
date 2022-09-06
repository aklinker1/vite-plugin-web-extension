import { ConfigEnv, mergeConfig, Plugin, UserConfig } from "vite";
import { PluginOptions } from "../options";
import { Logger } from "./logger";
import { manifestWriterPlugin } from "../plugins/manifest-writer-plugin";
import { compact } from "./arrays";
import { entryFilenameToOutput } from "./filenames";
import { Manifest } from "webextension-polyfill";
import { InputOption } from "rollup";
import { PLUGIN_NAME } from "./constants";
import { labeledStepPlugin } from "../plugins/labeled-step-plugin";

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
  const { plugin: manifestWriter, loadManifest } =
    manifestWriterPlugin(options);
  const manifest = await loadManifest();

  const configs: UserConfig[] = [
    {
      build: {
        rollupOptions: {
          input: "manifest.json",
        },
      },
      plugins: [manifestWriter],
    },
  ];
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

  if (configs.length === 0)
    throw Error(
      "No inputs found in manifest.json. Set `options.verbose = true` for more details."
    );

  return cleanupBasedOnOrder(configs, {
    manifestWriter,
    logger: options.logger,
  });
}

function cleanupBasedOnOrder(
  buildConfigs: UserConfig[],
  options: { manifestWriter: Plugin; logger: Logger }
): UserConfig[] {
  for (let i = 0; i < buildConfigs.length; i++) {
    buildConfigs[i] = mergeConfig(buildConfigs[i], {
      plugins: [labeledStepPlugin(options.logger, buildConfigs.length, i)],
    });
  }

  buildConfigs[0].plugins ??= [];
  buildConfigs[0].plugins.push(options.manifestWriter);

  const subsequentConfig: UserConfig = {
    clearScreen: false,
    build: {
      emptyOutDir: false,
    },
  };
  for (let i = 1; i < buildConfigs.length; i++) {
    buildConfigs[i] = removePlugin(
      mergeConfig(buildConfigs[i], subsequentConfig),
      PLUGIN_NAME
    );
  }
  return buildConfigs;
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

function removePlugin(config: UserConfig, pluginName: string): UserConfig {
  return {
    ...config,
    plugins:
      config.plugins?.filter(
        (plugin) =>
          plugin && (!("name" in plugin) || plugin.name !== pluginName)
      ) ?? [],
  };
}
