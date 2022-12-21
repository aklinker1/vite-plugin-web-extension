import prompt, { Choice } from "prompts";
import fs from "fs-extra";
import path from "node:path";
import { Listr } from "listr2";
import commandExists from "command-exists";
import {
  InputProjectOptions,
  PackageManager,
  ProjectOptions,
  TemplateName,
  TEMPLATES,
} from "./types";
import {
  createProject,
  installDependencies,
  prepareProjectDirectory,
} from "./tasks";

export async function initProject(
  inputOptions: InputProjectOptions
): Promise<void> {
  const options = await resolveOptions(inputOptions);
  const { projectName, packageManager } = options;

  console.log();

  const tasks = new Listr([
    prepareProjectDirectory(options),
    createProject(options),
    installDependencies(options),
  ]);
  await tasks.run();

  console.log();

  console.log(`All done! To start the extension, run:`);
  console.log();
  if (projectName !== ".") console.log(`  cd ${projectName}`);
  console.log(`  ${packageManager} start`);
  console.log();
}

async function resolveOptions(
  options: InputProjectOptions
): Promise<ProjectOptions> {
  let { projectName, forceOverwrite, selectedTemplate, packageManager } =
    options;

  if (!projectName) {
    const res = await prompt({
      name: "projectName",
      type: "text",
      message: "Project Name",
      validate: validateProjectName,
    });
    if (res.projectName == null) throw Error();
    projectName = res.projectName as string;
  }

  if (fs.existsSync(projectName) && fs.readdirSync(projectName).length > 0) {
    const res = await prompt({
      type: "confirm",
      name: "forceOverwrite",
      message: `"${projectName}" exists and is not empty. Overwrite it?`,
    });
    if (res.forceOverwrite == null) throw Error();
    forceOverwrite = res.forceOverwrite as boolean;
  }

  if (!selectedTemplate) {
    const res = await prompt({
      name: "selectedTemplate",
      type: "select",
      message: "Template",
      choices: TEMPLATES.map((template) => ({
        title: template,
        value: template,
      })),
    });
    if (res.selectedTemplate == null) throw Error();
    selectedTemplate = res.selectedTemplate as TemplateName;
  }

  if (!packageManager) {
    const choices: Choice[] = [];
    if (commandExists.sync("npm")) choices.push({ title: "NPM", value: "npm" });
    if (commandExists.sync("pnpm"))
      choices.push({ title: "PNPM", value: "pnpm" });
    if (commandExists.sync("yarn")) choices.push({ title: "Yarn", value: "" });

    if (choices.length > 1) {
      const res = await prompt({
        name: "packageManager",
        message: "Package Manager",
        type: "select",
        choices,
      });
      if (res.packageManager == null) throw Error();
      packageManager = res.packageManager as PackageManager;
    } else {
      packageManager = choices[0].value! as PackageManager;
    }
  }

  return {
    templateBranch: "create-package",
    projectName,
    forceOverwrite,
    selectedTemplate,
    packageManager,
  };
}

async function validateProjectName(
  projectName: string
): Promise<string | true> {
  if (!fs.existsSync(projectName)) return true;

  const stats = await fs.stat(projectName);
  if (!stats.isDirectory())
    return `Project path exists and is not a directory (${path.resolve(
      process.cwd(),
      projectName
    )})`;

  return true;
}