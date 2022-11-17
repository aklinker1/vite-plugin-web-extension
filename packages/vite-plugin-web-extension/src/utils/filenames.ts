import { GREEN, RESET, CYAN, VIOLET } from "./logger";
import path from "node:path";

/**
 * Returns the file path minus the `.[ext]` if present.
 */
export function trimExtension(filename: string): string;
export function trimExtension(filename: undefined): undefined;
export function trimExtension(filename: string | undefined): string | undefined;
export function trimExtension(
  filename: string | undefined
): string | undefined {
  return filename?.replace(path.extname(filename), "");
}

/**
 * Color a filename based on Vite's bundle summary
 * - HTML green
 * - Assets violet
 * - Chunks cyan
 *
 * It's not a perfect match because sometimes JS files are assets, but it's good enough.
 */
export function colorizeFilename(filename: string) {
  let color = CYAN;
  if (filename.match(/.(html|pug)$/)) color = GREEN;
  if (filename.match(/.(css|scss|stylus|sass|png|jpg|jpeg|webp|webm|svg|ico)$/))
    color = VIOLET;
  return `${color}${filename}${RESET}`;
}
