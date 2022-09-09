import { OutputBundle } from "rollup";
import { UserConfig } from "vite";

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
    config: <UserConfig>{
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
    cleanupBundle(bundle: OutputBundle) {
      const tempAsset =
        Object.entries(bundle).find(
          ([_, asset]) =>
            asset.type === "chunk" && asset.facadeModuleId === tempResolvedId
        ) ?? [];
      if (tempAsset?.[0] && bundle[tempAsset[0]]) delete bundle[tempAsset[0]];
    },
  };
}
