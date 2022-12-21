import { ListrTask } from "listr2";
import { ProjectOptions } from "../types";
import tmp from "tmp";
import simpleGit from "simple-git";

const REMOTE = "template";
const REPO = "https://github.com/aklinker1/vite-plugin-web-extension.git";

function makeTempDir(): Promise<{ tempDir: string; rmTempDir: () => void }> {
  return new Promise((res, rej) => {
    tmp.dir({}, (err, tempDir, rmTempDir) => {
      if (err) return rej(err);
      return res({ tempDir, rmTempDir });
    });
  });
}

export const createProject = ({
  templateBranch,
}: ProjectOptions): ListrTask => ({
  title: "Create Project",
  async task() {
    const { tempDir, rmTempDir } = await makeTempDir();
    const git = simpleGit(tempDir);
    await git.init();
    await git.addRemote(REMOTE, REPO);
    await git.checkoutBranch(templateBranch, `${REMOTE}/${templateBranch}`);
    try {
    } finally {
      rmTempDir();
    }
  },
});
