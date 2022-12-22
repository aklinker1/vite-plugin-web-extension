export const TEMPLATES = [
  "js",
  "ts",
  "vue-js",
  "vue-ts",
  "react-js",
  "react-ts",
] as const;
export type TemplateName = typeof TEMPLATES[number];

export const PACKAGE_MANAGERS = ["npm", "pnpm", "yarn"] as const;
export type PackageManager = typeof PACKAGE_MANAGERS[number];

export interface InputProjectOptions {
  projectName?: string;
  forceOverwrite?: boolean;
  selectedTemplate?: TemplateName;
  packageManager?: PackageManager;
  templateBranch?: string;
}

export interface ProjectOptions {
  projectName: string;
  forceOverwrite?: boolean;
  selectedTemplate: TemplateName;
  packageManager: PackageManager;
  templateBranch: string;
}
