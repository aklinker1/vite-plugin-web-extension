import prompt, { Choice } from "prompts";
import fs from "fs-extra";
import path from "node:path";
import { Listr } from "listr2";
import commandExists from "command-exists";
import { InputProjectOptions, PackageManager, ProjectOptions } from "./types";
import {
  createProject,
  installDependencies,
  prepareProjectDirectory,
} from "./tasks";
import { fetchJson } from "./utils";
import {
  DEFAULT_TEMPLATES_ORIGIN_URL,
  DEFAULT_TEMPLATE_BRANCH,
} from "./defaults";

const START_COMMANDS: Record<PackageManager, string> = {
  npm: "npm run dev",
  pnpm: "pnpm dev",
  yarn: "yarn dev",
};

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
  console.log(`  ${START_COMMANDS[packageManager]}`);
  console.log();
}

async function resolveOptions(
  options: InputProjectOptions
): Promise<ProjectOptions> {
  let {
    projectName,
    forceOverwrite,
    selectedTemplate,
    packageManager,
    templateBranch,
    templatesOriginUrl,
  } = options;

  templateBranch ??= DEFAULT_TEMPLATE_BRANCH;
  templatesOriginUrl ??= DEFAULT_TEMPLATES_ORIGIN_URL;

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

  if (
    forceOverwrite == null &&
    fs.existsSync(projectName) &&
    fs.readdirSync(projectName).length > 0
  ) {
    const res = await prompt({
      type: "confirm",
      name: "forceOverwrite",
      message: `"${projectName}" exists and is not empty. Overwrite it?`,
    });
    if (res.forceOverwrite == null) throw Error();
    forceOverwrite = res.forceOverwrite as boolean;
  }

  if (!selectedTemplate) {
    const templatesUrl = `https://raw.githubusercontent.com/aklinker1/vite-plugin-web-extension/${templateBranch}/packages/create-vite-plugin-web-extension/templates/templates.json`;
    const templates = await fetchJson<string[]>(templatesUrl).catch((err) => {
      console.error(err);
      throw Error(
        `\nFailed to load templates from url (${templatesUrl}).\nSee above error.`
      );
    });
    const res = await prompt({
      name: "selectedTemplate",
      type: "select",
      message: "Template",
      choices: templates.map((value) => ({ title: value, value })),
    });
    if (res.selectedTemplate == null) throw Error();
    selectedTemplate = res.selectedTemplate as string;
  }

  if (!packageManager) {
    const choices: Choice[] = [];
    if (commandExists.sync("npm")) choices.push({ title: "NPM", value: "npm" });
    if (commandExists.sync("pnpm"))
      choices.push({ title: "PNPM", value: "pnpm" });
    if (commandExists.sync("yarn"))
      choices.push({ title: "Yarn", value: "yarn" });

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
    projectName,
    forceOverwrite,
    selectedTemplate,
    packageManager,
    templateBranch,
    templatesOriginUrl,
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
