import { MANIFEST_LOADER_PLUGIN_NAME } from "./constants";

export interface Logger {
  verbose(message: string): void;
  log(message: string): void;
  warn(message: string): void;
  error(message: string, error: unknown): void;
}

export let RESET = "\x1b[0m";
export let BOLD = "\x1b[1m";
export let DIM = "\x1b[2m";
export let RED = "\x1b[91m";
export let GREEN = "\x1b[92m";
export let YELLOW = "\x1b[93m";
export let BLUE = "\x1b[94m";
export let VIOLET = "\x1b[95m";
export let CYAN = "\x1b[96m";

export function createLogger(
  verbose?: boolean,
  disableColor?: boolean
): Logger {
  if (disableColor) {
    RESET = "";
    BOLD = "";
    DIM = "";
    RED = "";
    GREEN = "";
    YELLOW = "";
    BLUE = "";
    VIOLET = "";
    CYAN = "";
  }
  return {
    verbose(message: string) {
      if (!verbose) return;
      console.debug(
        message
          .split("\n")
          .map(
            (line) =>
              `  ${BOLD}${DIM}${MANIFEST_LOADER_PLUGIN_NAME}${RESET} ${line}`
          )
          .join("\n")
      );
    },
    log(message: string) {
      console.log(message);
    },
    warn(message: string) {
      console.warn(
        message
          .split("\n")
          .map(
            (line) =>
              `${BOLD}${YELLOW}[${MANIFEST_LOADER_PLUGIN_NAME}] WARN: ${line}${RESET}`
          )
          .join("\n")
      );
    },
    error(message: string, err: unknown) {
      console.error(
        message
          .split("\n")
          .map(
            (line) =>
              `${BOLD}${RED}[${MANIFEST_LOADER_PLUGIN_NAME}] ERROR: ${line}${RESET}`
          )
          .join("\n")
      );
      console.error(err);
    },
  };
}
