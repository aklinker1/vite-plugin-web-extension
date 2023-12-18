import { describe, expect, it } from "vitest";
import { renderManifest, BundleMap } from "./renderManifest";

describe("renderManifest", () => {
  it("should render entrypoints (other than content_scripts)", () => {
    const input = {
      name: "mv2-html-test",
      version: "1.0.0",
      options_ui: {
        page: "options.html",
      },
      action: {
        default_popup: "action.pug",
      },
      page_action: {
        default_popup: "pages/page-popup.pug",
      },
      browser_action: {
        default_popup: "browser-popup.html",
      },
      side_panel: {
        default_path: "sidebar.html",
      },
      sidebar_action: {
        default_panel: "sidebar.html",
      },
      devtools_page: "devtools.pug",
      sandbox: {
        pages: ["sandbox1.pug", "sandbox2.html"],
      },
      background: {
        service_worker: "bg1.ts",
        page: "bg2.html",
        scripts: ["bg3.ts", "bg4.js"],
      },
    };
    const bundles: BundleMap = {
      "options.html": ["options.html", "options.css", "options.js"],
      "sidebar.html": ["sidebar.html"],
      "action.pug": ["action.html", "action.css", "action.js"],
      "pages/page-popup.pug": [
        "pages/page-popup.html",
        "pages/page-popup.css",
        "pages/page-popup.js",
      ],
      "browser-popup.html": [
        "browser-popup.css",
        "browser-popup.css",
        "browser-popup.html",
      ],
      "devtools.pug": ["devtools.js", "devtools.html", "devtools.css"],
      "sandbox1.pug": ["sandbox1.html"],
      "sandbox2.html": ["sandbox2.html"],
      "bg1.ts": ["bg1.js"],
      "bg2.html": ["bg2.html"],
      "bg3.ts": ["bg3.js"],
      "bg4.js": ["bg4.js"],
    };
    const expected = {
      name: "mv2-html-test",
      version: "1.0.0",
      options_ui: {
        page: "options.html",
      },
      action: {
        default_popup: "action.html",
      },
      page_action: {
        default_popup: "pages/page-popup.html",
      },
      browser_action: {
        default_popup: "browser-popup.html",
      },
      side_panel: {
        default_path: "sidebar.html",
      },
      sidebar_action: {
        default_panel: "sidebar.html",
      },
      devtools_page: "devtools.html",
      sandbox: {
        pages: ["sandbox1.html", "sandbox2.html"],
      },
      background: {
        service_worker: "bg1.js",
        page: "bg2.html",
        scripts: ["bg3.js", "bg4.js"],
      },
    };

    const actual = renderManifest(input, bundles);

    expect(actual).toEqual(expected);
  });

  it("should render content_script entrypoints, adding any generated files to the output", () => {
    const input = {
      content_scripts: [
        {
          js: ["script1.cs.ts", "cs/script2.js"],
          css: ["cs/script2.scss"],
        },
        {
          js: ["script3.js"],
        },
        {
          js: ["script4.ts"],
        },
      ],
    };
    const bundles: BundleMap = {
      "script1.cs.ts": ["script1.cs.js", "style.css"],
      "cs/script2.js": ["cs/script2.js"],
      "cs/script2.scss": ["cs/script2.css"],
      "script3.js": ["script3.css", "script3.js"],
      "script4.ts": ["script4.js"],
    };
    const expected = {
      content_scripts: [
        {
          js: ["script1.cs.js", "cs/script2.js"],
          css: ["cs/script2.css", "style.css"],
        },
        {
          js: ["script3.js"],
          css: ["script3.css"],
        },
        {
          js: ["script4.js"],
        },
      ],
    };

    const actual = renderManifest(input, bundles);

    expect(actual).toEqual(expected);
  });

  it("should support rendering the same entrypoint twice", () => {
    const input = {
      name: "mv2-html-test",
      version: "1.0.0",
      browser_action: {
        default_popup: "pages/popup.html",
      },
      sidebar_action: {
        default_panel: "pages/popup.html",
      },
    };
    const bundles: BundleMap = {
      "pages/popup.html": [
        "pages/popup.html",
        "pages/popup.css",
        "pages/popup.js",
      ],
    };
    const expected = {
      name: "mv2-html-test",
      version: "1.0.0",
      browser_action: {
        default_popup: "pages/popup.html",
      },
      sidebar_action: {
        default_panel: "pages/popup.html",
      },
    };

    const actual = renderManifest(input, bundles);

    expect(actual).toEqual(expected);
  });

  it("should not transform 'public:' prefixed paths", () => {
    const input = {
      name: "mv2-html-test",
      version: "1.0.0",
      browser_action: {
        default_popup: "public:popup.html",
      },
    };
    const bundles: BundleMap = {};
    const expected = {
      name: "mv2-html-test",
      version: "1.0.0",
      browser_action: {
        default_popup: "popup.html",
      },
    };

    const actual = renderManifest(input, bundles);

    expect(actual).toEqual(expected);
  });
});
