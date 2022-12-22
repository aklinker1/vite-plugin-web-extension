export const PACKAGE_MANAGERS = ["npm", "pnpm", "yarn"] as const;
export type PackageManager = typeof PACKAGE_MANAGERS[number];

export interface InputProjectOptions {
  projectName?: string;
  forceOverwrite?: boolean;
  selectedTemplate?: string;
  packageManager?: PackageManager;
  templateBranch?: string;
  templatesOriginUrl?: string;
}

export interface ProjectOptions {
  projectName: string;
  forceOverwrite?: boolean;
  selectedTemplate: string;
  packageManager: PackageManager;
  templateBranch: string;
  templatesOriginUrl: string;
}
