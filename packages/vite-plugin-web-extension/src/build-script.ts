import path from "path";
import { inspect } from "util";
import * as Vite from "vite";
import { HookWaiter } from "./hook-waiter";

export interface BuildScriptConfig {
  inputAbsPath: string;
  outputRelPath: string;
  basePath?: string;
  libModeViteConfig?: Vite.UserConfigExport;
  baseViteConfig: Vite.UserConfig;
  watch: boolean;
}

export async function buildScript(
  config: BuildScriptConfig,
  hookWaiter: HookWaiter,
  log: Function
) {
  log("Building in lib mode:", inspect(config));
  const {
    baseViteConfig,
    basePath,
    libModeViteConfig,
    inputAbsPath,
    outputRelPath,
    watch,
  } = config;

  const filename = path.basename(outputRelPath);
  const outDir = path.resolve(
    baseViteConfig.build?.outDir ?? process.cwd(),
    path.join(outputRelPath, "..")
  );
  const plugins =
    baseViteConfig.plugins?.filter(
      (plugin) =>
        plugin &&
        (!("name" in plugin) || plugin.name !== "vite-plugin-web-extension")
    ) ?? [];
  plugins.push(hookWaiter.plugin());

  const buildConfig: Vite.InlineConfig = Vite.mergeConfig(
    {
      root: baseViteConfig.root,
      clearScreen: false,
      mode: baseViteConfig.mode,
      resolve: baseViteConfig.resolve,
      plugins,
      define: baseViteConfig.define,
      base: basePath,
      // Don't copy static assets for the lib builds - already done during multi-page builds
      publicDir: false,
      build: {
        ...baseViteConfig.build,
        // Exclude <root>/index.html from inputs
        rollupOptions: {},
        emptyOutDir: false,
        outDir,
        watch: watch
          ? {
              clearScreen: false,
            }
          : undefined,
        lib: {
          name: filename.replace(/-/g, "_").toLowerCase(),
          entry: inputAbsPath,
          formats: ["umd"],
          fileName: () => filename + ".js",
        },
      },
    },
    libModeViteConfig ?? {}
  );
  log("Final config:", inspect(buildConfig));
  await Vite.build({ ...buildConfig, configFile: false });
}
