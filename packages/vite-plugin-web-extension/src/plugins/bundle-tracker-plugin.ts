import * as vite from "vite";
import { BUNDLE_TRACKER_PLUGIN_NAME } from "../constants";

export interface BundleTrackerPlugin extends vite.Plugin {
  getChunks(): string[] | undefined;
}

/**
 * A plugin that tracks and saves the output bundle.
 *
 * When rendering the final manifest, we need to add any files the inputs generated, and the chunks
 * return by this plugin are used to get the generated files.
 */
export function bundleTrackerPlugin(): BundleTrackerPlugin {
  let chunks: string[] | undefined;
  return {
    name: BUNDLE_TRACKER_PLUGIN_NAME,
    buildStart() {
      chunks = undefined;
    },
    writeBundle(_, bundle) {
      chunks = Object.values(bundle).map((chunk) => chunk.fileName);
    },
    getChunks: () => chunks,
  };
}
