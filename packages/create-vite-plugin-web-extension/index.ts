#!/usr/bin/env node

import { program } from "commander";
import {
  DEFAULT_TEMPLATES_ORIGIN_URL,
  DEFAULT_TEMPLATE_BRANCH,
} from "./src/defaults";
import { initProject } from "./src/initProject";

program
  .argument("[project-name]")
  .option("-t, --template <template>")
  .option("-p, --package-manager <package-manager>", "npm, pnpm, or yarn")
  .option(
    "--repo <remote-url>",
    "The repo to get templates from. Set this if working off a fork.",
    DEFAULT_TEMPLATES_ORIGIN_URL
  )
  .option(
    "--branch <branch>",
    "The branch to look for templates on. Set this to the development branch name if developing new templates.",
    DEFAULT_TEMPLATE_BRANCH
  )
  .parse();

const options = program.opts();

initProject({
  projectName: program.args[0],
  selectedTemplate: options.template,
  packageManager: options.packageManager,
  templateBranch: options.branch,
  templatesOriginUrl: options.repo,
}).catch((err) => {
  console.error(err.message);
  process.exit(1);
});
