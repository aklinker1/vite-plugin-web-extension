import path from "path";
import * as Vite from "vite";
import { HookWaiter } from "./hook-waiter";

export interface BuildScriptConfig {
  inputAbsPath: string;
  outputRelPath: string;
  vite: Vite.UserConfig;
  watch: boolean;
}

export async function buildScript(
  config: BuildScriptConfig,
  hookWaiter: HookWaiter
) {
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
  await Vite.build({
    root: config.vite.root,
    clearScreen: false,
    mode: config.vite.mode,
    resolve: config.vite.resolve,
    plugins,
    define: config.vite.define,
    build: {
      ...config.vite.build,
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
  });
}
