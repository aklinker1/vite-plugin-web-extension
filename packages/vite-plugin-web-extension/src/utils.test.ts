import * as vite from "vite";
import { describe, expect, it } from "vitest";
import { ProjectPaths } from "./options";
import {
  getInputPaths,
  getOutputFile,
  resolveBrowserTagsInObject,
  trimExtension,
} from "./utils";

describe("Utils", () => {
  describe("trimExtension", () => {
    it.each([
      ["", ""],
      ["file.js", "file"],
      ["path/to/file.ts", "path/to/file"],
      ["path/to/.hidden.jpeg", "path/to/.hidden"],
      [".hidden.jpeg", ".hidden"],
      [".png", ".png"],
    ])(`should convert "%s" to "%s"`, (input, expected) => {
      expect(trimExtension(input)).toEqual(expected);
    });
  });

  describe("resolveBrowserTagsInObject", () => {
    it("should remove fields that have a different browser tag", () => {
      const input = {
        "{{a}}.field1": "A",
        "{{b}}.field1": "B",
        field2: "C",
        "{{undefined}}": "D",
      };

      expect(resolveBrowserTagsInObject("a", input)).toEqual({
        field1: "A",
        field2: "C",
      });
      expect(resolveBrowserTagsInObject("b", input)).toEqual({
        field1: "B",
        field2: "C",
      });
      expect(resolveBrowserTagsInObject("x", input)).toEqual({
        field2: "C",
      });
      expect(resolveBrowserTagsInObject(undefined, input)).toEqual({
        field2: "C",
      });
    });

    it("should remove string entries from arrays that have a different browser tag", () => {
      const input = ["{{a}}.A", "{{b}}.B", "C"];

      expect(resolveBrowserTagsInObject("a", input)).toEqual(["A", "C"]);
      expect(resolveBrowserTagsInObject("b", input)).toEqual(["B", "C"]);
      expect(resolveBrowserTagsInObject("x", input)).toEqual(["C"]);
    });

    it("should recurse through the entire object tree", () => {
      const input = {
        field1: {
          field2: ["{{a}}.A", "{{b}}.B"],
          field3: ["C", "{{a}}.A"],
        },
        field4: [
          { "{{a}}.field5": "A", field6: "C" },
          { "{{b}}.field7": "B", field8: "C" },
        ],
      };

      expect(resolveBrowserTagsInObject("a", input)).toEqual({
        field1: {
          field2: ["A"],
          field3: ["C", "A"],
        },
        field4: [{ field5: "A", field6: "C" }, { field8: "C" }],
      });
    });
  });

  describe("getOutputFile", () => {
    it.each([
      ["some/file.html", "some/file.html"],
      ["some/file.pug", "some/file.html"],
      // CSS
      ["some/file.css", "some/file.css"],
      ["some/file.scss", "some/file.css"],
      ["some/file.stylus", "some/file.css"],
      ["some/file.sass", "some/file.css"],
      // JS
      ["some/file.js", "some/file.js"],
      ["some/file.jsx", "some/file.js"],
      ["some/file.ts", "some/file.js"],
      ["some/file.tsx", "some/file.js"],
      // unmodified
      ["some/file.png", "some/file.png"],
      ["some/file.jpg", "some/file.jpg"],
      ["some/file.jpeg", "some/file.jpeg"],
      ["some/file.webp", "some/file.webp"],
      ["some/file.webm", "some/file.webm"],
      ["some/file.svg", "some/file.svg"],
      ["some/file.ico", "some/file.ico"],
    ])("should convert %s to %s", (input, expected) => {
      expect(getOutputFile(input)).toEqual(expected);
    });
  });

  describe("getInputPaths", () => {
    const paths: ProjectPaths = {
      outDir: "/path/to/project/dist",
      rootDir: "/path/to/project",
      publicDir: "/path/to/project/public",
    };

    it("should keep relative paths relative", () => {
      const inputs = ["popup/index.html", "background.ts"];
      const expected = inputs;

      const actual = getInputPaths(paths, inputs);

      expect(actual).toEqual(expected);
    });

    it("should make absolute paths relative", () => {
      const inputs = [
        "/path/to/content-script.ts",
        "/path/to/project/src/options.html",
      ];
      const expected = ["../content-script.ts", "src/options.html"];

      const actual = getInputPaths(paths, inputs);

      expect(actual).toEqual(expected);
    });

    it("should convert window paths to unix", () => {
      const winPaths: ProjectPaths = {
        outDir: "C:\\path\\to\\project\\dist",
        rootDir: "C:\\path\\to\\project",
        publicDir: "C:\\path\\to\\project\\public",
      };
      const inputs = ["src\\popup.html"];
      const expected = ["src/popup.html"];

      const actual = getInputPaths(winPaths, inputs);

      expect(actual).toEqual(expected);
    });

    it("should work with a single, rollup input string", () => {
      const input = "index.ts";
      const expected = [input];

      const actual = getInputPaths(paths, input);

      expect(actual).toEqual(expected);
    });

    it("should work with a list of rollup input strings", () => {
      const inputList = ["index.ts", "index.js"];
      const expected = inputList;

      const actual = getInputPaths(paths, inputList);

      expect(actual).toEqual(expected);
    });

    it("should return the values when a record of rollup inputs is passed in", () => {
      const inputRecord = { one: "index.ts", two: "index.js" };
      const expected = ["index.ts", "index.js"];

      const actual = getInputPaths(paths, inputRecord);

      expect(actual).toEqual(expected);
    });

    it("should work with Vite library options", () => {
      const inputRecord: vite.LibraryOptions = {
        entry: ["src/test.ts", "test2.ts"],
      };
      const expected = inputRecord.entry;

      const actual = getInputPaths(paths, inputRecord);

      expect(actual).toEqual(expected);
    });
  });
});
