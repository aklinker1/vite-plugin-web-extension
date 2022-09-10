import { testBuild } from "./utils/test-build";
import fs from "fs/promises";
import WebExtension from "vite-plugin-web-extension";
import { defineConfig, InlineConfig } from "vite";
import path from "path";
import { expectManifest } from "./utils/expect-manifest";
import { describe, it, expect, beforeEach } from "vitest";

const DIST_DIRECTORY = path.resolve(process.cwd(), "dist");

async function expectBuildToMatchSnapshot(
  config: InlineConfig,
  expectedDirStructure: string[]
) {
  expect(await testBuild(config)).toMatchSnapshot();
  for (const file of expectedDirStructure) {
    expect(await fs.lstat(file)).toBeDefined();
  }
}

function manifest(overrides: any) {
  return () => ({
    name: "test",
    version: "1.0.0",
    description: "test manifest",
    manifest_version: 2,
    icons: {
      "16": "extension/assets/16.png",
      "48": "extension/assets/48.png",
      "128": "extension/assets/128.png",
    },
    ...overrides,
  });
}
function baseConfig(manifestOverrides: any): InlineConfig {
  return {
    root: "extension",
    build: {
      outDir: DIST_DIRECTORY,
      emptyOutDir: true,
    },
    plugins: [
      WebExtension({
        manifest: manifest(manifestOverrides),
      }),
    ],
  };
}
function baseOutputs(additionalOutputs?: string[]): string[] {
  return [
    "dist/manifest.json",
    "dist/assets/16.png",
    "dist/assets/48.png",
    "dist/assets/128.png",
    ...(additionalOutputs ?? []),
  ];
}

describe("Vite Plugin Web Extension", () => {
  beforeEach(async () => {
    try {
      await fs.rm(DIST_DIRECTORY, { recursive: true });
    } catch (err) {
      // We just want to delete the directory if it exists, so we don't care about this failing (ie: the dir doesn't exist)
    }
  });

  it("should build a simple popup extension", () =>
    expectBuildToMatchSnapshot(
      baseConfig({
        browser_action: {
          default_popup: "page1.html",
        },
      }),
      baseOutputs(["dist/page1.html"])
    ));

  it.skip("should build a simple background script extension", () =>
    expectBuildToMatchSnapshot(
      baseConfig({
        background: {
          scripts: ["script1.js", "script2.ts"],
        },
      }),
      [
        "dist/assets/16.png",
        "dist/assets/48.png",
        "dist/assets/128.png",
        "dist/script1.js",
        "dist/script2.js",
      ]
    ));

  it("should build a extension with both html pages and scripts", () =>
    expectBuildToMatchSnapshot(
      baseConfig({
        browser_action: {
          default_popup: "page1.html",
        },
        background: {
          scripts: ["script1.js", "script2.ts"],
        },
      }),
      baseOutputs(["dist/script1.js", "dist/script2.js"])
    ));

  it.each<[boolean, boolean]>([
    [true, false],
    [true, true],
    [false, false],
    [false, true],
  ])(
    "should not fail when emptyOutDir=%s and the outDirExists=%s",
    async (emptyOutDir: boolean, distExists: boolean) => {
      if (distExists) {
        await fs.mkdir(DIST_DIRECTORY);
        expect((await fs.lstat(DIST_DIRECTORY)).isDirectory()).toBe(true);
      } else {
        await expect(() => fs.lstat(DIST_DIRECTORY)).rejects.toThrowError(
          "ENOENT: no such file or directory"
        );
      }
      await expectBuildToMatchSnapshot(
        {
          root: "extension",
          build: {
            outDir: DIST_DIRECTORY,
            emptyOutDir,
          },
          plugins: [
            WebExtension({
              manifest: manifest({
                browser_action: {
                  default_popup: "page1.html",
                },
              }),
            }),
          ],
        },
        baseOutputs(["dist/page1.html"])
      );
    }
  );

  it("should work when the vite root is not specified", () =>
    expectBuildToMatchSnapshot(
      {
        build: {
          outDir: DIST_DIRECTORY,
          emptyOutDir: true,
        },
        plugins: [
          WebExtension({
            manifest: manifest({
              browser_action: {
                default_popup: "extension/page1.html",
              },
            }),
          }),
        ],
      },
      [
        "dist/extension/assets/16.png",
        "dist/extension/assets/48.png",
        "dist/extension/assets/128.png",
        "dist/extension/page1.html",
        "dist/manifest.json",
      ]
    ));

  it("should build additional inputs along side the rest of the manifest", () =>
    expectBuildToMatchSnapshot(
      {
        root: "extension",
        build: {
          outDir: DIST_DIRECTORY,
          emptyOutDir: true,
        },
        plugins: [
          WebExtension({
            manifest: manifest({
              browser_action: {
                default_popup: "page1.html",
              },
              background: {
                scripts: ["script1.js"],
              },
            }),
            additionalInputs: ["script2.ts"],
          }),
        ],
      },
      baseOutputs(["dist/page1.html", "dist/script1.js", "dist/script2.js"])
    ));

  it.each([
    [
      undefined,
      expect.objectContaining({
        manifest_version: 3,
        action: {
          default_popup: "page1.html",
        },
        content_scripts: [
          {
            matches: ["https://google.com/*"],
            js: ["script1.js"],
          },
        ],
      }),
    ],
    [
      "chrome",
      expect.objectContaining({
        manifest_version: 3,
        action: {
          default_popup: "page1.html",
        },
        content_scripts: [
          {
            matches: ["https://google.com/*"],
            js: ["script1.js"],
          },
        ],
      }),
    ],
    [
      "firefox",
      expect.objectContaining({
        manifest_version: 2,
        browser_action: {
          default_popup: "page1.html",
        },
        content_scripts: [
          {
            matches: ["https://duckduckgo.com/*"],
            js: ["script1.js"],
          },
        ],
      }),
    ],
  ])(
    "should respect the browser flags, removing fields other than %s (defaults to chrome)",
    async (browser, expectedManifest) => {
      await expectBuildToMatchSnapshot(
        {
          root: "extension",
          build: {
            outDir: DIST_DIRECTORY,
          },
          plugins: [
            WebExtension({
              manifest: manifest({
                "{{chrome}}.manifest_version": 3,
                "{{firefox}}.manifest_version": 2,
                "{{firefox}}.browser_action": {
                  default_popup: "page1.html",
                },
                "{{chrome}}.action": {
                  default_popup: "page1.html",
                },
                content_scripts: [
                  {
                    matches: [
                      "{{chrome}}.https://google.com/*",
                      "{{firefox}}.https://duckduckgo.com/*",
                    ],
                    js: ["script1.js", "{{other}}.script2.ts"],
                  },
                ],
              }),
              browser,
            }),
          ],
        },
        [] // Don't worry about validating the actual files, other tests handle that
      );
      expectManifest(expectedManifest);
    }
  );

  it("should include assets from the publicDir", () =>
    expectBuildToMatchSnapshot(
      {
        build: {
          outDir: DIST_DIRECTORY,
          emptyOutDir: true,
        },
        publicDir: "extension/assets",
        plugins: [
          WebExtension({
            manifest: manifest({
              browser_action: {
                default_popup: "extension/page1.html",
              },
            }),
          }),
        ],
      },
      ["dist/16.png", "dist/48.png", "dist/128.png"]
    ));

  it("should support supplementing the library mode build config via libModeViteConfig", () =>
    expectBuildToMatchSnapshot(
      {
        build: {
          outDir: DIST_DIRECTORY,
          emptyOutDir: true,
        },
        publicDir: "extension/assets",
        plugins: [
          WebExtension({
            manifest: manifest({
              browser_action: {
                default_popup: "extension/page1.html",
              },
              background: {
                service_worker: "extension/dynamic-import.ts",
              },
            }),
            libModeViteConfig: defineConfig({
              build: {
                rollupOptions: {
                  output: {
                    inlineDynamicImports: true,
                  },
                },
              },
            }),
          }),
        ],
      },
      ["dist/16.png", "dist/48.png", "dist/128.png"]
    ));
});
