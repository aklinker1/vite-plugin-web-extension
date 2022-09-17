import { describe, expect, it } from "vitest";
import { resolveBrowserTagsInObject } from "./resolve-browser-flags";

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
