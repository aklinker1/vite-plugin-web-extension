export function entryFilenameToInput(filename: string): string {
  return filename.substring(0, filename.lastIndexOf("."));
}
