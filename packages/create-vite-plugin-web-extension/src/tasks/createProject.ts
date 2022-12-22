import { ListrTask } from "listr2";
import { ProjectOptions } from "../types";
import tmp from "tmp";
import simpleGit from "simple-git";
import fs from "fs-extra";
import path from "node:path";

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

export const createProject = ({
  selectedTemplate,
  templateBranch,
  projectName,
  templatesOriginUrl,
}: ProjectOptions): ListrTask => ({
  title: "Create Project",
  async task(_, task) {
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
    } finally {
      rmTempDir();
    }
  },
});
