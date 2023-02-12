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
      "/reference/plugin-options.md",
      {
        text: "v1",
        children: [
          {
            text: "v2 Docs",
            link: "https://v2.vite-plugin-web-extension.aklinker1.io",
            target: "_blank",
          },
          {
            text: "v1 Docs",
            link: "/",
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
            "/guide/configuration.md",
            "/guide/manual-installation.md",
          ],
        },
      ],
      "/reference/": ["/reference/plugin-options.md"],
    },
  }),
});
