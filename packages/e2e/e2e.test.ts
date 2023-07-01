import { testBuild } from "./utils/test-build";
import fs from "fs/promises";
import * as vite from "vite";
import path from "path";
import { expectManifest } from "./utils/expect-manifest";
import { describe, it, expect, beforeEach } from "vitest";
import webExtension from "vite-plugin-web-extension";

const DIST_DIRECTORY = path.resolve(process.cwd(), "dist");

async function expectBuildToMatchSnapshot(
  config: vite.UserConfig,
  expectedDirStructure: string[]
) {
  const res = await testBuild(config);
  for (const file of expectedDirStructure) {
    expect(await fs.lstat(file)).toBeDefined();
  }
  expect(res).toMatchSnapshot();
}

function manifest(overrides: any) {
  return {
    name: "test",
    version: "1.0.0",
    description: "test manifest",
    manifest_version: 2,
    icons: {
      "16": "16.png",
      "48": "48.png",
      "128": "128.png",
    },
    ...overrides,
  };
}
function baseConfig(manifestOverrides: any): vite.UserConfig {
  return {
    root: "extension",
    build: {
      outDir: DIST_DIRECTORY,
      emptyOutDir: true,
    },
    plugins: [
      webExtension({
        manifest: () => manifest(manifestOverrides),
      }),
    ],
  };
}
function baseOutputs(additionalOutputs?: string[]): string[] {
  return [
    "dist/manifest.json",
    "dist/16.png",
    "dist/48.png",
    "dist/128.png",
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

  describe("Manifest inputs", () => {
    it.each<[string, { input: any; expected: any }]>([
      // API-enabled HTML entrypoints
      [
        "action.default_popup",
        {
          input: manifest({ action: { default_popup: "page2.html" } }),
          expected: manifest({ action: { default_popup: "page2.html" } }),
        },
      ],
      [
        "devtools_page",
        {
          input: manifest({ devtools_page: "page2.html" }),
          expected: manifest({ devtools_page: "page2.html" }),
        },
      ],
      [
        "options_page",
        {
          input: manifest({ options_page: "page2.html" }),
          expected: manifest({ options_page: "page2.html" }),
        },
      ],
      [
        "options_ui.page",
        {
          input: manifest({ options_ui: { page: "page2.html" } }),
          expected: manifest({ options_ui: { page: "page2.html" } }),
        },
      ],
      [
        "browser_action.default_popup",
        {
          input: manifest({
            browser_action: { default_popup: "page2.html" },
          }),
          expected: manifest({
            browser_action: { default_popup: "page2.html" },
          }),
        },
      ],
      [
        "page_action.default_popup",
        {
          input: manifest({ page_action: { default_popup: "page2.html" } }),
          expected: manifest({
            page_action: { default_popup: "page2.html" },
          }),
        },
      ],
      [
        "background.page",
        {
          input: manifest({ background: { page: "page2.html" } }),
          expected: manifest({ background: { page: "page2.html" } }),
        },
      ],
      [
        "chrome_url_overrides.bookmarks",
        {
          input: manifest({
            chrome_url_overrides: { bookmarks: "page2.html" },
          }),
          expected: manifest({
            chrome_url_overrides: { bookmarks: "page2.html" },
          }),
        },
      ],
      [
        "chrome_url_overrides.history",
        {
          input: manifest({
            chrome_url_overrides: { history: "page2.html" },
          }),
          expected: manifest({
            chrome_url_overrides: { history: "page2.html" },
          }),
        },
      ],
      [
        "chrome_url_overrides.newtab",
        {
          input: manifest({
            chrome_url_overrides: { newtab: "page2.html" },
          }),
          expected: manifest({
            chrome_url_overrides: { newtab: "page2.html" },
          }),
        },
      ],
      [
        "chrome_settings_overrides.homepage",
        {
          input: manifest({
            chrome_settings_overrides: { homepage: "page2.html" },
          }),
          expected: manifest({
            chrome_settings_overrides: { homepage: "page2.html" },
          }),
        },
      ],
      // API-disabled HTML entrypoints
      [
        "sandbox.pages",
        {
          input: manifest({
            sandbox: { pages: ["page1.html", "page2.html"] },
          }),
          expected: manifest({
            sandbox: { pages: ["page1.html", "page2.html"] },
          }),
        },
      ],
      // Scripts
      [
        "background.service_worker",
        {
          input: manifest({
            background: { service_worker: "dynamic-import.ts" },
          }),
          expected: manifest({
            background: { service_worker: "dynamic-import.js" },
          }),
        },
      ],
      [
        "background.scripts",
        {
          input: manifest({
            background: {
              scripts: ["module.ts", "dynamic-import.ts", "script1.js"],
            },
          }),
          expected: manifest({
            background: {
              scripts: ["module.js", "dynamic-import.js", "script1.js"],
            },
          }),
        },
      ],
      [
        "content_scripts[x].js",
        {
          input: manifest({
            content_scripts: [
              {
                matches: ["<all_urls>"],
                js: ["module.ts", "script2.ts"],
              },
            ],
          }),
          expected: manifest({
            content_scripts: [
              {
                matches: ["<all_urls>"],
                js: ["module.js", "script2.js"],
                css: ["script2.css"],
              },
            ],
          }),
        },
      ],
      [
        "content_scripts[x].css",
        {
          input: manifest({
            content_scripts: [
              {
                matches: ["<all_urls>"],
                css: ["page1.scss"],
              },
            ],
          }),
          expected: manifest({
            content_scripts: [
              {
                matches: ["<all_urls>"],
                css: ["page1.css"],
              },
            ],
          }),
        },
      ],
    ])(
      "should auto-build and render the manifest.%s in the final manifest",
      async (_, { input, expected }) => {
        await expectBuildToMatchSnapshot(baseConfig(input), baseOutputs());
        expectManifest(expected);
      },
      {
        // Chunk output can be random, and thus makes the snapshots flakey
        retry: 5,
      }
    );

    it("should build a extension with both html pages and scripts", async () => {
      await expectBuildToMatchSnapshot(
        baseConfig({
          browser_action: {
            default_popup: "page1.html",
          },
          background: {
            scripts: ["script1.js", "script2.ts"],
          },
        }),
        baseOutputs(["dist/script1.js", "dist/script2.js"])
      );
      expectManifest(
        manifest({
          browser_action: {
            default_popup: "page1.html",
          },
          background: {
            scripts: ["script1.js", "script2.js"],
          },
        })
      );
    });
  });

  describe("Configuration", () => {
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
              webExtension({
                manifest: () =>
                  manifest({
                    browser_action: {
                      default_popup: "page1.html",
                    },
                  }),
              }),
            ],
          },
          baseOutputs(["dist/page1.html"])
        );
        expectManifest(
          manifest({
            browser_action: {
              default_popup: "page1.html",
            },
          })
        );
      }
    );

    it("should work when the vite root is not specified", async () => {
      await expectBuildToMatchSnapshot(
        {
          publicDir: "extension/public",
          build: {
            outDir: DIST_DIRECTORY,
            emptyOutDir: true,
          },
          plugins: [
            webExtension({
              manifest: () =>
                manifest({
                  browser_action: {
                    default_popup: "extension/page1.html",
                  },
                }),
            }),
          ],
        },
        [
          "dist/16.png",
          "dist/48.png",
          "dist/128.png",
          "dist/extension/page1.html",
          "dist/manifest.json",
        ]
      );
      expectManifest(
        manifest({
          browser_action: {
            default_popup: "extension/page1.html",
          },
        })
      );
    });

    it("should build additional inputs along side the rest of the manifest", async () => {
      await expectBuildToMatchSnapshot(
        {
          root: "extension",
          build: {
            outDir: DIST_DIRECTORY,
            emptyOutDir: true,
          },
          plugins: [
            webExtension({
              manifest: () =>
                manifest({
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
      );
      expectManifest(
        manifest({
          browser_action: {
            default_popup: "page1.html",
          },
          background: {
            scripts: ["script1.js"],
          },
        })
      );
    });

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
              webExtension({
                manifest: () =>
                  manifest({
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

    it("should support supplementing the script build config via scriptViteConfig", async () => {
      await expectBuildToMatchSnapshot(
        {
          root: "extension",
          build: {
            outDir: DIST_DIRECTORY,
            emptyOutDir: true,
          },
          plugins: [
            webExtension({
              manifest: () =>
                manifest({
                  background: {
                    service_worker: "dynamic-import.ts",
                  },
                }),
              scriptViteConfig: {
                build: {
                  rollupOptions: {
                    output: {
                      inlineDynamicImports: true,
                    },
                  },
                },
              },
            }),
          ],
        },
        baseOutputs()
      );
      expectManifest(
        manifest({
          background: {
            service_worker: "dynamic-import.js",
          },
        })
      );
    });

    it("should include assets from the publicDir", () =>
      expectBuildToMatchSnapshot(
        {
          build: {
            outDir: DIST_DIRECTORY,
            emptyOutDir: true,
          },
          publicDir: "extension/public",
          plugins: [
            webExtension({
              manifest: () =>
                manifest({
                  browser_action: {
                    default_popup: "extension/page1.html",
                  },
                }),
            }),
          ],
        },
        ["dist/16.png", "dist/48.png", "dist/128.png"]
      ));

    it("should support supplementing the script build config via scriptViteConfig", () =>
      expectBuildToMatchSnapshot(
        {
          build: {
            outDir: DIST_DIRECTORY,
            emptyOutDir: true,
          },
          publicDir: "extension/public",
          plugins: [
            webExtension({
              manifest: () =>
                manifest({
                  browser_action: {
                    default_popup: "extension/page1.html",
                  },
                  background: {
                    service_worker: "extension/dynamic-import.ts",
                  },
                }),
              scriptViteConfig: {
                build: {
                  rollupOptions: {
                    output: {
                      inlineDynamicImports: true,
                    },
                  },
                },
              },
            }),
          ],
        },
        ["dist/16.png", "dist/48.png", "dist/128.png"]
      ));

    it("should not fail if the public directory doesn't exist", () =>
      expectBuildToMatchSnapshot(
        {
          build: {
            outDir: DIST_DIRECTORY,
            emptyOutDir: true,
          },
          publicDir: "extension/does-not-exist",
          plugins: [
            webExtension({
              manifest: () =>
                manifest({
                  action: {
                    default_popup: "extension/page1.html",
                  },
                }),
            }),
          ],
        },
        ["dist/extension/page1.html"]
      ));

    it("should print validation errors when the manifest is invalid", async () => {
      const build = testBuild({
        build: {
          outDir: DIST_DIRECTORY,
          emptyOutDir: true,
        },
        publicDir: "extension/public",
        plugins: [
          webExtension({
            manifest: () => ({
              action: {
                default_popup: "extension/page1.html",
              },
            }),
          }),
        ],
      });

      await expect(build).rejects.toMatchSnapshot();
    });

    it("should support transforming the manifest synchronously prior to output via transformManifest", async () => {
      await expectBuildToMatchSnapshot(
        {
          root: "extension",
          build: {
            outDir: DIST_DIRECTORY,
            emptyOutDir: true,
          },
          plugins: [
            webExtension({
              manifest: () =>
                manifest({
                  browser_action: {
                    default_popup: "page1.html",
                  },
                }),
              transformManifest: (manifest) => ({
                name: 'Transform Added Name',
                ...manifest
              })
            }),
          ],
        },
        baseOutputs(["dist/page1.html"])
      );
      expectManifest(
        manifest({
          name: 'Transform Added Name',
          browser_action: {
            default_popup: "page1.html",
          },
        })
      );
    })

    it("should support transforming the manifest asynchronously prior to output via transformManifest", async () => {
      await expectBuildToMatchSnapshot(
        {
          root: "extension",
          build: {
            outDir: DIST_DIRECTORY,
            emptyOutDir: true,
          },
          plugins: [
            webExtension({
              manifest: () =>
                manifest({
                  browser_action: {
                    default_popup: "page1.html",
                  },
                }),
              transformManifest: (manifest) => Promise.resolve({
                name: 'Transform Added Name',
                ...manifest
              })
            }),
          ],
        },
        baseOutputs(["dist/page1.html"])
      );
      expectManifest(
        manifest({
          name: 'Transform Added Name',
          browser_action: {
            default_popup: "page1.html",
          },
        })
      );
    })
  });
});
