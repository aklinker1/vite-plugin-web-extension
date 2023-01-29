import * as vite from "vite";
import { describe, expect, it } from "vitest";
import {
  removePlugin,
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

  describe("removePlugin", () => {
    it("should remove a plugin by name from a simple list", async () => {
      const nameToRemove = "2";
      const input: Array<vite.PluginOption | vite.PluginOption[]> = [
        { name: "1" },
        { name: "2" },
        { name: "3" },
      ];
      const expected: Array<vite.PluginOption | vite.PluginOption[]> = [
        { name: "1" },
        { name: "3" },
      ];

      expect(await removePlugin(input, nameToRemove)).toEqual(expected);
    });

    it("should remove a plugin by name outside a deeply nested list", async () => {
      const nameToRemove = "2";
      const input: Array<vite.PluginOption | vite.PluginOption[]> = [
        { name: "1" },
        { name: "2" },
        [{ name: "3" }, { name: "4" }],
      ];
      const expected: Array<vite.PluginOption | vite.PluginOption[]> = [
        { name: "1" },
        [{ name: "3" }, { name: "4" }],
      ];

      expect(await removePlugin(input, nameToRemove)).toEqual(expected);
    });

    it("should remove a plugin by name inside a nested list", async () => {
      const nameToRemove = "3";
      const input: Array<vite.PluginOption | vite.PluginOption[]> = [
        { name: "1" },
        { name: "2" },
        [{ name: "3" }, { name: "4" }],
      ];
      const expected: Array<vite.PluginOption | vite.PluginOption[]> = [
        { name: "1" },
        { name: "2" },
        [{ name: "4" }],
      ];

      expect(await removePlugin(input, nameToRemove)).toEqual(expected);
    });

    it("should remove a plugin by name inside a deeply nested list", async () => {
      const nameToRemove = "6";
      const input: Array<vite.PluginOption | vite.PluginOption[]> = [
        { name: "1" },
        { name: "2" },
        [
          { name: "3" },
          [{ name: "4" }, { name: "5" }, [{ name: "6" }]],
          { name: "7" },
        ],
      ];
      const expected: Array<vite.PluginOption | vite.PluginOption[]> = [
        { name: "1" },
        { name: "2" },
        [{ name: "3" }, [{ name: "4" }, { name: "5" }, []], { name: "7" }],
      ];

      expect(await removePlugin(input, nameToRemove)).toEqual(expected);
    });

    it("should remove a plugin multiple times if listed multiple times", async () => {
      const nameToRemove = "2";
      const input: Array<vite.PluginOption | vite.PluginOption[]> = [
        { name: "1" },
        { name: "2" },
        [{ name: "2" }, { name: "3" }, { name: "4" }],
      ];
      const expected: Array<vite.PluginOption | vite.PluginOption[]> = [
        { name: "1" },
        [{ name: "3" }, { name: "4" }],
      ];

      expect(await removePlugin(input, nameToRemove)).toEqual(expected);
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
});
