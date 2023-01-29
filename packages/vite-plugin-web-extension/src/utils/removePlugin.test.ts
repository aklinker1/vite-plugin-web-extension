import { PluginOption } from "vite";
import { describe, expect, it } from "vitest";
import { removePlugin } from "./removePlugin";

describe("removePlugin", () => {
  it("should remove a plugin by name from a simple list", async () => {
    const nameToRemove = "2";
    const input: Array<PluginOption | PluginOption[]> = [
      { name: "1" },
      { name: "2" },
      { name: "3" },
    ];
    const expected: Array<PluginOption | PluginOption[]> = [
      { name: "1" },
      { name: "3" },
    ];

    expect(await removePlugin(input, nameToRemove)).toEqual(expected);
  });

  it("should remove a plugin by name outside a deeply nested list", async () => {
    const nameToRemove = "2";
    const input: Array<PluginOption | PluginOption[]> = [
      { name: "1" },
      { name: "2" },
      [{ name: "3" }, { name: "4" }],
    ];
    const expected: Array<PluginOption | PluginOption[]> = [
      { name: "1" },
      [{ name: "3" }, { name: "4" }],
    ];

    expect(await removePlugin(input, nameToRemove)).toEqual(expected);
  });

  it("should remove a plugin by name inside a nested list", async () => {
    const nameToRemove = "3";
    const input: Array<PluginOption | PluginOption[]> = [
      { name: "1" },
      { name: "2" },
      [{ name: "3" }, { name: "4" }],
    ];
    const expected: Array<PluginOption | PluginOption[]> = [
      { name: "1" },
      { name: "2" },
      [{ name: "4" }],
    ];

    expect(await removePlugin(input, nameToRemove)).toEqual(expected);
  });

  it("should remove a plugin by name inside a deeply nested list", async () => {
    const nameToRemove = "6";
    const input: Array<PluginOption | PluginOption[]> = [
      { name: "1" },
      { name: "2" },
      [
        { name: "3" },
        [{ name: "4" }, { name: "5" }, [{ name: "6" }]],
        { name: "7" },
      ],
    ];
    const expected: Array<PluginOption | PluginOption[]> = [
      { name: "1" },
      { name: "2" },
      [{ name: "3" }, [{ name: "4" }, { name: "5" }, []], { name: "7" }],
    ];

    expect(await removePlugin(input, nameToRemove)).toEqual(expected);
  });

  it("should remove a plugin multiple times if listed multiple times", async () => {
    const nameToRemove = "2";
    const input: Array<PluginOption | PluginOption[]> = [
      { name: "1" },
      { name: "2" },
      [{ name: "2" }, { name: "3" }, { name: "4" }],
    ];
    const expected: Array<PluginOption | PluginOption[]> = [
      { name: "1" },
      [{ name: "3" }, { name: "4" }],
    ];

    expect(await removePlugin(input, nameToRemove)).toEqual(expected);
  });
});
