import { Logger } from "./logger";
import dns from "node:dns";
import https from "node:https";
import { inspect } from "node:util";
import Ajv from "ajv";
import { withTimeout } from "./utils";

const SCHEMA_URL = new URL("https://raw.githubusercontent.com/SchemaStore/schemastore/master/src/schemas/json/chrome-manifest.json");

export type ValidateManifest = (manifest: any | undefined) => Promise<void>;

/**
 * Create a service that validate's your manifest.json's content.
 *
 * TODO: Unit test.
 */
export function createManifestValidator(options: {
  logger: Logger;
}): ValidateManifest {
  const { logger } = options;
  let schema: any | undefined;
  const ajv = new Ajv();
  // Some formats are not listed in the schema, so accept anything when they are seen.
  ajv.addFormat("permission", /.*/);
  ajv.addFormat("content-security-policy", /.*/);
  ajv.addFormat("glob-pattern", /.*/);
  ajv.addFormat("match-pattern", /.*/);
  ajv.addFormat("mime-type", /.*/);

  function isOffline(): Promise<boolean> {
    const isOffline = new Promise<boolean>((res) => {
      dns.resolve(SCHEMA_URL.hostname, (err) => {
        if (err == null) {
          res(false);
        } else {
          logger.verbose("DNS not resolved");
          logger.verbose(inspect(err));
          res(true);
        }
      });
    });
    return withTimeout(isOffline, 1e3).catch(() => true);
  }

  async function loadSchema() {
    if (schema != null) return;
    logger.verbose(`Loading JSON schema from ${SCHEMA_URL.href}...`);
    schema = await get(SCHEMA_URL.href);
  }

  function get(url: string): Promise<any> {
    return new Promise<any>((res, rej) => {
      https
        .get(url, (response) => {
          let responseBody = "";
          response.on("data", (chunk) => {
            responseBody += chunk;
          });
          response.on("end", () => {
            res(JSON.parse(responseBody));
          });
        })
        .on("error", (err) => rej(err));
    });
  }

  return async (manifest) => {
    if (schema == null && (await isOffline()))
      return logger.warn(
        "Cannot connect to json.schemastore.org, skipping validation"
      );

    logger.verbose(`Validating manifest...`);
    if (manifest == null) throw Error(`Manifest cannot be ${manifest}`);
    await loadSchema();
    logger.verbose(`Loaded JSON schema: ${inspect(schema)}`);

    const success = await ajv.validate(schema, manifest);
    if (success) {
      logger.verbose("Manifest is valid");
      return;
    }

    throw Error(
      `Manifest is not valid: ${JSON.stringify(ajv.errors, null, 2)}`
    );
  };
}
