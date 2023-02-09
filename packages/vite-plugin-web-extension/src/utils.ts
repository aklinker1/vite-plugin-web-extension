import { GREEN, RESET, CYAN, VIOLET } from "./logger";
import path from "node:path";
import * as rollup from "rollup";
import * as vite from "vite";

/**
 * Returns the same array, but with null or undefined values removed.
 */
export function compact<T>(array: Array<T | undefined>): T[] {
  return array.filter((item) => item != null) as T[];
}

/**
 * Returns the file path minus the `.[ext]` if present.
 */
export function trimExtension(filename: string): string;
export function trimExtension(filename: undefined): undefined;
export function trimExtension(filename: string | undefined): string | undefined;
export function trimExtension(
  filename: string | undefined
): string | undefined {
  return filename?.replace(path.extname(filename), "");
}

/**
 * Color a filename based on Vite's bundle summary
 * - HTML green
 * - Assets violet
 * - Chunks cyan
 *
 * It's not a perfect match because sometimes JS files are assets, but it's good enough.
 */
export function colorizeFilename(filename: string) {
  let color = CYAN;
  if (filename.match(/.(html|pug)$/)) color = GREEN;
  if (filename.match(/.(css|scss|stylus|sass|png|jpg|jpeg|webp|webm|svg|ico)$/))
    color = VIOLET;
  return `${color}${filename}${RESET}`;
}

/**
 * This generates a set of utils to allow configuring rollup to not use any inputs. It works by
 * adding a virtual, empty JS file as an import, and removing it from the bundle output when
 * finished.
 */
export function defineNoRollupInput() {
  const tempId = "virtual:temp.js";
  const tempResolvedId = "\0" + tempId;
  const tempContent = "export const temp = true;";

  return {
    /**
     * Config used to ensure no inputs are required.
     */
    config: <vite.UserConfig>{
      build: {
        lib: {
          entry: tempId,
          formats: ["es"], // ES is the most minimal format. Since this is excluded from the bundle, this doesn't matter
          name: tempId,
          fileName: tempId,
        },
      },
    },
    /**
     * Handle resolving the temp entry id.
     */
    resolveId(id: string) {
      if (id.includes(tempId)) return tempResolvedId;
    },
    /**
     * Handle loading a non-empty, basic JS script for the temp input
     */
    load(id: string) {
      if (id === tempResolvedId) return tempContent;
    },
    /**
     * Remove the temporary input from the final bundle.
     */
    cleanupBundle(bundle: rollup.OutputBundle) {
      const tempAsset =
        Object.entries(bundle).find(
          ([_, asset]) =>
            asset.type === "chunk" && asset.facadeModuleId === tempResolvedId
        ) ?? [];
      if (tempAsset?.[0] && bundle[tempAsset[0]]) delete bundle[tempAsset[0]];
    },
  };
}

// TODO: Test
export function getRootDir(config: vite.ResolvedConfig): string {
  const cwd = process.cwd();
  const configFileDir = config.configFile
    ? path.resolve(cwd, config.configFile)
    : cwd;
  return path.resolve(configFileDir, config.root);
}

/**
 * Returns the absolute path to the outDir based on the resolved Vite config.
 *
 * TODO: Test
 *
 * > Must be absolute or it doesn't work on Windows:
 * > https://github.com/aklinker1/vite-plugin-web-extension/issues/63
 */
export function getOutDir(config: vite.ResolvedConfig): string {
  const { outDir } = config.build;
  return path.resolve(getRootDir(config), outDir);
}

// TODO: Test
export function getPublicDir(config: vite.ResolvedConfig): string | undefined {
  if (config.publicDir === "") return;
  return path.resolve(getRootDir(config), config.publicDir ?? "public");
}

// TODO: Test
export function getInputAbsPaths(
  input: rollup.InputOption | vite.LibraryOptions
): string[] {
  if (typeof input === "string") return [input];
  else if (Array.isArray(input)) return input;
  else if ("entry" in input) return [input.entry];
  else return Object.values(input);
}

/**
 * Remove a plugin by name from a `Array<PluginOption | PluginOption[]>`. Leaves the structure the
 * same, just removes any plugins that have the same name
 */
export async function removePlugin(
  plugins: Array<vite.PluginOption | vite.PluginOption[]> | undefined,
  pluginNameToRemove: string
): Promise<Array<vite.PluginOption | vite.PluginOption[]> | undefined> {
  if (!plugins) return plugins;

  const newPlugins: Array<vite.PluginOption | vite.PluginOption[]> = [];
  for (const itemPromise of plugins) {
    const item = await itemPromise;
    if (Array.isArray(item))
      newPlugins.push(await removePlugin(item, pluginNameToRemove));
    else if (!item || item.name !== pluginNameToRemove) newPlugins.push(item);
  }

  return newPlugins;
}

/**
 * Resolves fields with the `{{browser}}.xyz` prefix on an object. Used to resolve the manifest's
 * fields.
 *
 * @param browser Specify which fields should be used. If `firefox` is passed, it will only keep `{{firefox}}.xyz` values.
 * @param object The object who's fields need resolved. Can be a string, object, or array.
 * @returns The object, but will all it's deeply nested fields that begin with `{{..}}.` resolved.
 */
export function resolveBrowserTagsInObject(
  browser: string | undefined,
  object: any
): any {
  if (Array.isArray(object)) {
    return object
      .map((item) => resolveBrowserTagsInObject(browser, item))
      .filter((item) => !!item);
  } else if (typeof object === "object") {
    return Object.keys(object).reduce((newObject, key) => {
      if (!key.startsWith("{{") || key.startsWith(`{{${browser}}}.`)) {
        // @ts-expect-error: bad key typing
        newObject[key.replace(`{{${browser}}}.`, "")] =
          resolveBrowserTagsInObject(browser, object[key]);
      }
      return newObject;
    }, {});
  } else if (typeof object === "string") {
    if (!object.startsWith("{{") || object.startsWith(`{{${browser}}}.`)) {
      return object.replace(`{{${browser}}}.`, "");
    }
    return undefined;
  } else {
    return object;
  }
}

export function withTimeout<T>(
  promise: Promise<T>,
  duration: number
): Promise<T> {
  return new Promise((res, rej) => {
    const timeout = setTimeout(() => {
      rej(`Promise timed out after ${duration}ms`);
    }, duration);
    promise
      .then(res)
      .catch(rej)
      .finally(() => clearTimeout(timeout));
  });
}
