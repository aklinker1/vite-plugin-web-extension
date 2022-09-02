import fs from "fs";
import path from "path";

export function copyDirSync(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  let entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    let srcPath = path.join(src, entry.name);
    let destPath = path.join(dest, entry.name);

    entry.isDirectory()
      ? copyDirSync(srcPath, destPath)
      : fs.copyFileSync(srcPath, destPath);
  }
}
