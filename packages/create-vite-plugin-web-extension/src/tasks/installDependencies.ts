import { ListrTask } from "listr2";
import { ProjectOptions } from "../types";

export const installDependencies = ({}: ProjectOptions): ListrTask => ({
  title: "Install Dependencies",
  async task() {
    await new Promise((res) => setTimeout(res, 5000));
  },
});
