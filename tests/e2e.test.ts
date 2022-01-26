import { testBuild } from "./utils/test-build";
import fs from "fs";
import WebExtension from "vite-plugin-web-extension";
import { InlineConfig } from "vite";
import path from "path";
import { expectManifest } from "./utils/expect-manifest";

const DIST_DIRECTORY = path.resolve(process.cwd(), "dist");

async function expectBuildToMatchSnapshot(
  config: InlineConfig,
  expectedDirStructure: string[]
) {
  expect(await testBuild(config)).toMatchSnapshot();
  for (const file of expectedDirStructure) {
    expect(fs.lstatSync(file)).toBeDefined();
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
function baseConfig(manifestOverrides: any) {
  return {
    root: "extension",
    build: {
      outDir: DIST_DIRECTORY,
      emptyOutDir: true,
    },
    plugins: [
      WebExtension({
        assets: "assets",
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
  beforeEach(() => {
    try {
      fs.rmdirSync(DIST_DIRECTORY, { recursive: true });
    } catch (err) {}
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
        fs.mkdirSync(DIST_DIRECTORY);
        expect(fs.lstatSync(DIST_DIRECTORY).isDirectory()).toBe(true);
      } else {
        expect(() => fs.lstatSync(DIST_DIRECTORY)).toThrowError(
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
              assets: "assets",
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
            assets: "extension/assets",
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
            assets: "assets",
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
              assets: "assets",
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
});
