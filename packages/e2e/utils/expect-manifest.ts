import { readJsonFile } from "vite-plugin-web-extension";

export function expectManifest(expectedContent: any) {
  const actualContent = readJsonFile("dist/manifest.json");

  expect(actualContent).toEqual(expectedContent);
}
