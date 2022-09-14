import { GREEN, RESET, CYAN, VIOLET } from "./logger";

export function entryFilenameToInput(filename: string): string {
  return filename.substring(0, filename.lastIndexOf("."));
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
