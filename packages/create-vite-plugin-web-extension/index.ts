import { program } from "commander";
import { initProject } from "./src/initProject";

program
  .argument("[project-name]")
  .option("-t, --template <template>")
  .option("-p, --package-manager <package-manager>", "npm, pnpm, or yarn")
  .option(
    "--branch <branch>",
    "The branch to look for templates on. This is only useful during development."
  )
  .parse();

const options = program.opts();
console.log(options);

initProject({
  projectName: program.args[0],
  selectedTemplate: options.template,
  packageManager: options.packageManager,
  templateBranch: options.branch,
}).catch((err) => {
  console.error(err.message);
  process.exit(1);
});
