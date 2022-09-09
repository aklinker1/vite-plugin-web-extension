export function entryFilenameToOutput(filename: string): string {
  return filename
    .replace(/.(tsx?|jsx?|json)$/, ".js")
    .replace(/.(scss|sass|less|stylus)$/, ".css");
}

export function entryFilenameToInput(filename: string): string {
  return filename.substring(0, filename.lastIndexOf("."));
}
