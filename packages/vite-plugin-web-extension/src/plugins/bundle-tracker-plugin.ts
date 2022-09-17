import { OutputAsset, OutputChunk } from "rollup";
import { Plugin } from "vite";
import { BUNDLE_TRACKER_PLUGIN_NAME } from "../utils/constants";

export interface BundleTrackerPlugin extends Plugin {
  getChunks(): Array<OutputChunk | OutputAsset> | undefined;
}

/**
 * A plugin that tracks and saves the output bundle for use when rendering the final manifest.
 */
export function bundleTrackerPlugin(): BundleTrackerPlugin {
  let chunks: Array<OutputChunk | OutputAsset> | undefined;
  return {
    name: BUNDLE_TRACKER_PLUGIN_NAME,
    buildStart() {
      chunks = undefined;
    },
    writeBundle(_, bundle) {
      chunks = Object.values(bundle);
    },
    getChunks: () => chunks,
  };
}
