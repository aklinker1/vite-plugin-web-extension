import JSON from "json5";
import YAML from "yaml";
import os from "node:os";
import { ProjectPaths } from "./options";
import path from "node:path";
import fs from "node:fs/promises";
import { Logger } from "./logger";

type ParserMap = Record<string, Array<{ parse: (text: string) => any }>>;
interface ConfigLayer {
  file?: string;
  config: any;
}

export async function loadConfig({
  paths,
  logger,
  overrides,
}: {
  overrides?: any;
  paths: ProjectPaths;
  logger: Logger;
}): Promise<{
  layers: ConfigLayer[];
  config: any;
}> {
  const directories = Array.from(
    new Set([paths.rootDir, process.cwd(), os.homedir()])
  );
  const parsers: ParserMap = {
    "": [JSON, YAML],
    ".json": [JSON],
    ".json5": [JSON],
    ".yml": [YAML],
    ".yaml": [YAML],
  };
  const names = [".webextrc", "webext.config"];

  const files: ParserMap = {};
  directories.forEach((dir) => {
    names.forEach((name) => {
      Object.entries(parsers).forEach(([ext, parsers]) => {
        files[path.resolve(dir, `${name}${ext}`)] = parsers;
      });
    });
  });

  const layers: ConfigLayer[] = [{ config: overrides ?? {} }];

  for (const [file, parsers] of Object.entries(files)) {
    parsersLoop: for (const parser of parsers) {
      try {
        const layer: ConfigLayer = { file, config: {} };
        const text = await fs.readFile(file, "utf-8");
        layer.config = parser.parse(text);
        if (typeof layer.config !== "object")
          throw Error("Config not an object");
        layers.push(layer);
        break parsersLoop;
      } catch (err) {
        // noop, we don't care about failures
      }
    }
  }

  return {
    layers,
    config: layers
      .map((layer) => layer.config)
      .reduceRight((prevConfig, nextConfig) => {
        return { ...prevConfig, ...nextConfig };
      }),
  };
}
