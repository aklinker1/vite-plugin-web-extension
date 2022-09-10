import { describe, expect, it } from "vitest";
import { entryFilenameToInput } from "./filenames";

describe("Filename Utils", () => {
  describe("entryFilenameToInput", () => {
    it.each([
      ["", ""],
      ["file.js", "file"],
      ["path/to/file.ts", "path/to/file"],
      ["path/to/.hidden.jpeg", "path/to/.hidden"],
      [".hidden.jpeg", ".hidden"],
      [".png", ""],
    ])(`should convert "%s" to "%s"`, (input, expected) => {
      expect(entryFilenameToInput(input)).toEqual(expected);
    });
  });
});
