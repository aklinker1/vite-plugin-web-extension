import { PLUGIN_NAME, LOGGER_PREFIX } from "./constants";

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
          .map((line) => `  ${BOLD}${DIM}${LOGGER_PREFIX}${RESET} ${line}`)
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
            (line) => `${BOLD}${YELLOW}[${LOGGER_PREFIX}] WARN: ${line}${RESET}`
          )
          .join("\n")
      );
    },
    error(message: string, err: unknown) {
      console.error(
        message
          .split("\n")
          .map(
            (line) => `${BOLD}${RED}[${LOGGER_PREFIX}] ERROR: ${line}${RESET}`
          )
          .join("\n")
      );
      console.error(err);
    },
  };
}
