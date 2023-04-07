export const MANIFEST_LOADER_PLUGIN_NAME = `web-extension:manifest`;
export const LABELED_STEP_PLUGIN_NAME = `web-extension:labeled-step`;
export const MULTIBUILD_COMPLETE_PLUGIN_NAME = `web-extension:multibuild`;
export const BUNDLE_TRACKER_PLUGIN_NAME = `web-extension:bundle-tracker`;
export const HMR_REWRITE_PLUGIN_NAME = `web-extension:hmr-rewrite`;

/**
 * A list of plugin names that should be removed from script builds.
 *
 * See <https://github.com/aklinker1/vite-plugin-web-extension/issues/99> for more info.
 */
export const SCRIPT_PLUGIN_BLOCKLIST = ["vite:vue"];
