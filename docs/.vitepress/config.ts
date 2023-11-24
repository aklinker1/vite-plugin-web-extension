import { defineConfig } from "vitepress";

const ogDescription = "Modern Chrome Extension Development";
const ogTitle = "Vite Plugin Web Extension";
const ogUrl = "https://vite-plugin-web-extension.aklinker1.io";
const ogImage =
  "https://github.com/aklinker1/vite-plugin-web-extension/raw/main/.github/assets/social-banner.png";

const helpSidebar = {
  text: "Help",
  items: [
    {
      text: "Migrate to V4",
      link: "/guide/migration-v4",
    },
    {
      text: "Migrate to V3",
      link: "/guide/migration-v3",
    },
    // {
    //   text: "Blog",
    //   link: "/blog/",
    // },
  ],
};

export default defineConfig({
  title: "Vite Plugin Web Extension",
  description: "Modern chrome extension devlopment",

  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: "/logo.svg" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:title", content: ogTitle }],
    ["meta", { property: "og:image", content: ogImage }],
    ["meta", { property: "og:url", content: ogUrl }],
    ["meta", { property: "og:description", content: ogDescription }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "twitter:site", content: "@vite_js" }],
    ["meta", { name: "theme-color", content: "#646cff" }],
    [
      "script",
      {
        async: "",
        "data-website-id": "ff6f5003-5d9a-4d48-86e9-62f9d2038034",
        src: "https://umami.aklinker1.io/script.js",
      },
    ],
  ],

  themeConfig: {
    logo: "/logo.svg",

    editLink: {
      pattern:
        "https://github.com/aklinker1/vite-plugin-web-extension/edit/main/docs/:path",
      text: "Suggest changes to this page",
    },

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/aklinker1/vite-plugin-web-extension",
      },
    ],

    footer: {
      message: `Released under the MIT License.`,
      copyright: "Copyright © 2021-present Aaron Klinker",
    },

    nav: [
      { text: "Guide", link: "/guide/" },
      { text: "Config", link: "/config/plugin-options" },
      {
        text: "v4",
        items: [
          { text: "v4 (Latest)", link: "/" },
          {
            text: "v3",
            link: "https://v3.vite-plugin-web-extension.aklinker1.io/",
          },
          {
            text: "v2",
            link: "https://v2.vite-plugin-web-extension.aklinker1.io/",
          },
          {
            text: "v1",
            link: "https://v1.vite-plugin-web-extension.aklinker1.io/",
          },
        ],
      },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Guide",
          items: [
            { text: "Installation", link: "/guide/" },
            { text: "Development Cycle", link: "/guide/development" },
            {
              text: "Building for Production",
              link: "/guide/building-for-production",
            },
            {
              text: "Frontend Frameworks",
              link: "/guide/frontend-frameworks",
            },
            {
              text: "Support Multiple Browsers",
              link: "/guide/supporting-multiple-browsers",
            },
            {
              text: "Configure Browser Startup",
              link: "/guide/configure-browser-startup",
            },
            {
              text: "Localization",
              link: "/guide/localization",
            },
          ],
        },
        helpSidebar,
      ],
      "/config/": [
        {
          text: "Config",
          items: [{ text: "Plugin Options", link: "/config/plugin-options" }],
        },
        helpSidebar,
      ],
    },
  },
});
