import { Manifest } from "webextension-polyfill";
import { getOutputFile } from "../utils";

/**
 * A map of the entrypoints listed in the manifest template to their output bundle filenames.
 */
export interface BundleMap {
  [entry: string]: string[];
}

/**
 * Given a manifest with source code inputs, and a list of all the output files per build, output
 * the final manifest used by the browser.
 *
 * 1. Replace all inputs with their bundled outputs.
 * 2. If a content script output a CSS file, add the CSS file to the content script definition
 */
export function renderManifest(
  input: any,
  bundles: BundleMap
): Manifest.WebExtensionManifest {
  // Clone the input to the output.
  const output: any = JSON.parse(JSON.stringify(input));

  replaceEntrypoint(bundles, output.action, "default_popup");
  replaceEntrypoint(bundles, output, "devtools_page");
  replaceEntrypoint(bundles, output, "options_page");
  replaceEntrypoint(bundles, output.options_ui, "page");
  replaceEntrypoint(bundles, output.browser_action, "default_popup");
  replaceEntrypoint(bundles, output.page_action, "default_popup");
  replaceEntrypoint(bundles, output.side_panel, "default_path");
  replaceEntrypoint(bundles, output.sidebar_action, "default_panel");
  replaceEntrypointArray(bundles, output.sandbox?.pages);
  replaceEntrypoint(bundles, output.background, "service_worker");
  replaceEntrypoint(bundles, output.background, "page");
  replaceEntrypointArray(bundles, output.background?.scripts);

  output.content_scripts?.forEach((cs: Manifest.ContentScript) => {
    replaceEntrypointArray(bundles, cs.css);
    replaceEntrypointArray(bundles, cs.js, (generated) => {
      if (!generated.endsWith("css")) return;

      cs.css ??= [];
      cs.css.push(generated);
    });
  });

  return output;
}

/**
 * For the given entrypoint, return the replacement from the output, and all the other files that
 * were output.
 */
function findReplacement(entry: string, bundles: BundleMap) {
  const output = getOutputFile(entry);
  const generatedFiles = bundles[entry];
  if (generatedFiles == null)
    throw Error("Render Manifest: Bundle output not found for: " + entry);

  const replacementIndex = generatedFiles.indexOf(output);
  if (replacementIndex < 0)
    throw Error(`Entrypoint output for ${entry} (${output}) not found`);

  const [replacement] = generatedFiles.slice(
    replacementIndex,
    replacementIndex + 1
  );
  return {
    replacement,
    generatedFiles,
  };
}

function replaceEntrypoint<T>(
  bundles: BundleMap,
  parent: T,
  key: keyof NonNullable<T>,
  onGeneratedFile?: (file: string) => void
) {
  const entry = parent?.[key] as string | undefined;
  if (entry == null) return;

  if (entry.startsWith("public:")) {
    // @ts-expect-error
    parent[key] = entry.replace("public:", "");
  } else {
    const { replacement, generatedFiles } = findReplacement(entry, bundles);
    // @ts-expect-error
    parent[key] = replacement;

    if (onGeneratedFile) generatedFiles.forEach(onGeneratedFile);
  }
}

function replaceEntrypointArray<T>(
  bundles: BundleMap,
  parent: T[] | undefined,
  onGeneratedFile?: (file: string) => void
) {
  if (parent == null) return;

  for (let i = 0; i < parent.length; i++) {
    replaceEntrypoint(bundles, parent, i, onGeneratedFile);
  }
}
