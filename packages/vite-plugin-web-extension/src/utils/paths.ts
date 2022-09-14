import { ResolvedConfig } from "vite";
import path from "node:path";
import { InputOption } from "rollup";

// TODO: Test
export function getRootDir(config: ResolvedConfig): string {
  const cwd = process.cwd();
  const configFileDir = config.configFile
    ? path.resolve(cwd, config.configFile)
    : cwd;
  return path.resolve(configFileDir, config.root);
}

// TODO: Test
export function getOutDir(config: ResolvedConfig): string {
  const { outDir } = config.build;
  return path.resolve(getRootDir(config), outDir);
}

// TODO: Test
export function getPublicDir(config: ResolvedConfig): string | undefined {
  if (config.publicDir === "") return;
  return path.resolve(getRootDir(config), config.publicDir ?? "public");
}

// TODO: Test
export function getInputAbsPaths(input: InputOption): string[] {
  if (typeof input === "string") return [input];
  else if (Array.isArray(input)) return input;
  else return Object.values(input);
}
