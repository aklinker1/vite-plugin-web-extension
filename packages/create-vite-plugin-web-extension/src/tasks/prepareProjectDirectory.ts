import { ProjectOptions } from "../types";
import fs from "fs-extra";
import { ListrTask } from "listr2";

/**
 * Make sure the project directory exists and is empty.
 */
export const prepareProjectDirectory = ({
  forceOverwrite,
  projectName,
}: ProjectOptions): ListrTask => ({
  title: "Prepare Project Directory",
  async task() {
    if (forceOverwrite) await fs.remove(projectName);
    await fs.ensureDir(projectName);
  },
});
