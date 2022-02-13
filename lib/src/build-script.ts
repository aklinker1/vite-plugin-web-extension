import path from "path";
import * as Vite from "vite";
import { HookWaiter } from "./hook-waiter";

export interface BuildScriptConfig {
  inputAbsPath: string;
  outputRelPath: string;
  basePath?: string;
  vite: Vite.UserConfig;
  watch: boolean;
}

export async function buildScript(
  config: BuildScriptConfig,
  hookWaiter: HookWaiter,
  log: Function
) {
  log("Building in lib mode:", JSON.stringify(config, null, 2));
  const filename = path.basename(config.outputRelPath);
  const outDir = path.resolve(
    config.vite.build?.outDir ?? process.cwd(),
    path.join(config.outputRelPath, "..")
  );
  const plugins =
    config.vite.plugins?.filter(
      (plugin) =>
        plugin &&
        (!("name" in plugin) || plugin.name !== "vite-plugin-web-extension")
    ) ?? [];
  plugins.push(hookWaiter.plugin());

  const buildConfig: Vite.InlineConfig = {
    root: config.vite.root,
    clearScreen: false,
    mode: config.vite.mode,
    resolve: config.vite.resolve,
    plugins,
    define: config.vite.define,
    base: config.basePath,
    publicDir: false,
    build: {
      ...config.vite.build,
      // Exclude <root>/index.html from inputs
      rollupOptions: {},
      emptyOutDir: false,
      outDir,
      watch: config.watch
        ? {
            clearScreen: false,
          }
        : undefined,
      lib: {
        name: filename.replace(/-/g, "_").toLowerCase(),
        entry: config.inputAbsPath,
        formats: ["umd"],
        fileName: () => filename + ".js",
      },
    },
  };
  log("Final config:", JSON.stringify(buildConfig, null, 2));
  await Vite.build(buildConfig);
}
