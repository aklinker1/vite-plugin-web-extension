import { InlineConfig } from "vite";
import path from "node:path";

export function getRootDir(config: InlineConfig): string {
  return path.resolve(process.cwd(), config.root ?? process.cwd());
}

export function getOutDir(config: InlineConfig): string {
  const outDir = config.build?.outDir ?? "dist";
  return path.resolve(getRootDir(config), outDir);
}
