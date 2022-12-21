import { execaCommand } from "execa";
import { ListrTask } from "listr2";
import { ProjectOptions } from "../types";
import path from "node:path";

export const installDependencies = ({
  packageManager,
  projectName,
}: ProjectOptions): ListrTask => ({
  title: "Install Dependencies",
  async task(_, task) {
    let installCommand = `${packageManager} i`;
    if (packageManager === "yarn") installCommand = "yarn";

    task.output = `${installCommand}...`;
    await execaCommand(installCommand, {
      cwd: path.resolve(process.cwd(), projectName),
    });
  },
});
