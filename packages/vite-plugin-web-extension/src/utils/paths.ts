import { InlineConfig } from "vite";
import path from "node:path";

// TODO: Test
export function getRootDir(config: InlineConfig): string {
  return path.resolve(process.cwd(), config.root ?? process.cwd());
}

// TODO: Test
export function getOutDir(config: InlineConfig): string {
  const outDir = config.build?.outDir ?? "dist";
  return path.resolve(getRootDir(config), outDir);
}
