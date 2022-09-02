import { readJsonFile } from "vite-plugin-web-extension";
import { expect } from "vitest";

export function expectManifest(expectedContent: any) {
  const actualContent = readJsonFile("dist/manifest.json");

  expect(actualContent).toEqual(expectedContent);
}
