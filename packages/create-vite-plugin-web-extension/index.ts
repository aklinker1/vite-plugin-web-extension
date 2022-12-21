import { program } from "commander";
import { initProject } from "./src/initProject";

// program
//   .option("-s, --separator <char>");

program.parse();

initProject({
  projectName: "test",
  forceOverwrite: true,
  packageManager: "pnpm",
  selectedTemplate: "js",
  templateBranch: "create-package",
}).catch((err) => {
  console.error(err.message);
  process.exit(1);
});
