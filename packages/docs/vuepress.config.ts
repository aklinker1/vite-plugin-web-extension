import { defaultTheme, defineUserConfig } from "vuepress";
import { searchPlugin } from "@vuepress/plugin-search";

export default defineUserConfig({
  plugins: [searchPlugin()],
  title: "vite-plugin-web-extension",
  theme: defaultTheme({
    contributors: true,
    docsRepo: "https://github.com/aklinker1/vite-plugin-web-extension",
    docsBranch: "main",
    docsDir: "packages/docs",
    editLink: true,
    lastUpdated: true,
    repo: "https://github.com/aklinker1/vite-plugin-web-extension",
    navbar: [
      {
        text: "Guide",
        link: "/",
      },
      {
        text: "Config",
        link: "/config/index.md",
      },
      {
        text: "v2",
        children: [
          {
            text: "v2 Docs",
            link: "https://vite-plugin-web-extension.aklinker1.io",
          },
          {
            text: "v1 Docs",
            link: "https://v1.vite-plugin-web-extension.aklinker1.io",
            target: "_blank",
          },
        ],
      },
    ],
    sidebar: {
      "/": [
        {
          text: "Guide",
          children: [
            "/",
            "/guide/development.md",
            "/guide/building-for-production.md",
            "/guide/supporting-multiple-browsers.md",
            "/guide/frontend-frameworks.md",
            "/guide/configure-browser-startup.md",
          ],
        },
        {
          text: "Help",
          children: ["/guide/manual-setup.md", "/guide/migration-v2.md"],
        },
      ],
      "/config/": ["/config/index.md"],
    },
  }),
});
