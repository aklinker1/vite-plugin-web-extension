import { execaCommand } from "execa";
import { ListrTask } from "listr2";
import { ProjectOptions } from "../types";
import path from "node:path";
import { sleep } from "../utils";
import fs from "fs-extra";

export const installDependencies = ({
  packageManager,
  projectName,
}: ProjectOptions): ListrTask => ({
  title: "Install Dependencies",
  async task(_, task) {
    let installCommand = `${packageManager} i`;
    if (packageManager === "yarn") installCommand = "yarn";

    task.output = `${installCommand}...`;
    const cwd = path.resolve(process.cwd(), projectName);
    const res = await execaCommand(installCommand, { cwd });
    await fs.writeFile("test.log", res.stdout, { encoding: "utf8" });
    await fs.writeFile("test2.log", res.stderr, { encoding: "utf8" });
  },
});
