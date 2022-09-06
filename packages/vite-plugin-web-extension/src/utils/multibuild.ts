import { UserConfig } from "vite";

export type ViteMultibuild = (configs: UserConfig[]) => Promise<void>;
