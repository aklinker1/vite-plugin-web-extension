import { InlineConfig } from "vite";
import path from "node:path";
import { InputOption } from "rollup";

// TODO: Test
export function getRootDir(config: InlineConfig): string {
  return path.resolve(process.cwd(), config.root ?? process.cwd());
}

// TODO: Test
export function getOutDir(config: InlineConfig): string {
  const outDir = config.build?.outDir ?? "dist";
  return path.resolve(getRootDir(config), outDir);
}

// TODO: Test
export function getPublicDir(config: InlineConfig): string | undefined {
  if (config.publicDir === false) return;
  return path.resolve(getRootDir(config), config.publicDir ?? "public");
}

// TODO: Test
export function getInputAbsPaths(input: InputOption): string[] {
  if (typeof input === "string") return [input];
  else if (Array.isArray(input)) return input;
  else return Object.values(input);
}
