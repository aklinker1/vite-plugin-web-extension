import { PLUGIN_NAME, VERBOSE_LOGGER } from "./constants";

export interface Logger {
  verbose(message: string): void;
  log(message: string): void;
  warn(message: string): void;
  error(message: string, error: unknown): void;
}

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RED = "\x1b[91m";
const GREEN = "\x1b[92m";
const YELLOW = "\x1b[93m";

export function createLogger(verbose?: boolean): Logger {
  return {
    verbose(message: string) {
      if (!verbose) return;
      console.debug(
        message
          .split("\n")
          .map(
            (line) => `  ${BOLD}${DIM}vite:${VERBOSE_LOGGER}${RESET} ${line}`
          )
          .join("\n")
      );
    },
    log(message: string) {
      console.log(
        message
          .split("\n")
          .map((line) => `${BOLD}${GREEN}[${PLUGIN_NAME}]${RESET} ${line}`)
          .join("\n")
      );
    },
    warn(message: string) {
      console.warn(
        message
          .split("\n")
          .map(
            (line) => `${BOLD}${YELLOW}[${PLUGIN_NAME}] WARN: ${line}${RESET}`
          )
          .join("\n")
      );
    },
    error(message: string, err: unknown) {
      console.error(
        message
          .split("\n")
          .map((line) => `${BOLD}${RED}[${PLUGIN_NAME}] ERROR: ${line}${RESET}`)
          .join("\n")
      );
      console.error(err);
    },
  };
}
