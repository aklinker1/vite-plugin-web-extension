import { describe, expect, it } from "vitest";
import { entryFilenameToOutput } from "./filenames";

describe("Filename Utils", () => {
  describe("entryFilenameToOutput", () => {
    it.each([
      ["", ""],
      ["file.js", "file.js"],
      ["file.json", "file.js"],
      ["file.jsx", "file.js"],
      ["file.jsx", "file.js"],
      ["file.ts", "file.js"],
      ["file.tsx", "file.js"],
      ["file.html", "file.html"],
      ["file.css", "file.css"],
      ["file.scss", "file.css"],
      ["file.stylus", "file.css"],
      ["file.less", "file.css"],
      ["path/to/file.ts", "path/to/file.js"],
      ["file.png", "file.png"],
      ["file.jpeg", "file.jpeg"],
    ])(`should convert "%s" to "%s"`, (input, expected) => {
      expect(entryFilenameToOutput(input)).toEqual(expected);
    });
  });
});
