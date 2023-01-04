import { ListrTask } from "listr2";
import { ProjectOptions } from "../types";
import tmp from "tmp";
import simpleGit from "simple-git";
import fs, { stat } from "fs-extra";
import path from "node:path";
import isBinaryPath from "is-binary-path";

const TEMPLATES_FOLDER_IN_REPO =
  "packages/create-vite-plugin-web-extension/templates";

function makeTempDir(): Promise<{ tempDir: string; rmTempDir: () => void }> {
  return new Promise((res, rej) => {
    tmp.dir({}, (err, tempDir, rmTempDir) => {
      if (err) return rej(err);
      return res({ tempDir, rmTempDir });
    });
  });
}

export const createProject = (options: ProjectOptions): ListrTask => ({
  title: "Create Project",
  async task(_, task) {
    const {
      selectedTemplate,
      templateBranch,
      projectName,
      templatesOriginUrl,
    } = options;

    task.output = "Creating temp directory...";
    const { tempDir, rmTempDir } = await makeTempDir();

    try {
      task.output = "Cloning template repo...";
      const git = simpleGit(tempDir);
      await git
        .init()
        .addRemote("origin", templatesOriginUrl)
        .pull("origin", templateBranch);

      task.output = "Copying template files into project...";
      const templatesFolder = path.resolve(tempDir, TEMPLATES_FOLDER_IN_REPO);
      const sharedFolder = path.resolve(templatesFolder, "shared");
      const templateFolder = path.resolve(templatesFolder, selectedTemplate);
      await fs.copy(sharedFolder, projectName);
      await fs.copy(templateFolder, projectName, { overwrite: true });

      await replaceTemplateVariablesInProject(options);
    } finally {
      rmTempDir();
    }
  },
});

async function replaceTemplateVariablesInProject(options: ProjectOptions) {
  const files = await walkDir(options.projectName);
  const projectPath = path.resolve(options.projectName);
  const projectName = path.basename(projectPath);

  for (const file of files) {
    if (isBinaryPath(file)) continue;

    const content = await fs.readFile(file, "utf8");
    const newContent = content
      .replaceAll("${{ template.projectName }}", projectName)
      .replaceAll("${{ template.templateName }}", options.selectedTemplate);
    await fs.writeFile(file, newContent, { encoding: "utf8" });
  }
}

async function walkDir(dir: string): Promise<string[]> {
  const allFiles: string[] = [];

  const queue: string[] = [dir];
  let file: string;
  while ((file = queue.shift()!) != null) {
    const stats = await fs.lstat(file);
    if (stats.isDirectory()) {
      const children = await fs.readdir(file);
      const childrenPaths = children.map((child) => path.join(file, child));
      queue.push(...childrenPaths);
    } else if (stats.isFile()) {
      allFiles.push(file);
    }
  }

  return allFiles;
}
