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
        link: "/guide",
      },
      {
        text: "Reference",
        children: [
          {
            text: "Miasma",
            children: [
              "/reference/server-config.md",
              "/reference/cli.md",
              "/reference/graphql.md",
            ],
          },
        ],
      },
    ],
    sidebar: {
      "/": [
        {
          text: "Guide",
          children: [
            "/guide",
            "/guide/installation.md",
            "/guide/configuration.md",
          ],
        },
      ],
      "/reference/": [
        "/reference/server-config.md",
        "/reference/cli.md",
        "/reference/graphql.md",
      ],
    },
  }),
});
