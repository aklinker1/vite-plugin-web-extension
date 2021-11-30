import Ajv from "ajv";
import https from "https";

const SCHEMA_URL = "https://json.schemastore.org/chrome-manifest";

// Validate

const ajv = new Ajv();
ajv.addFormat("match-pattern", /.*/);
ajv.addFormat("glob-pattern", /.*/);
ajv.addFormat("content-security-policy", /.*/);
ajv.addFormat("mime-type", /.*/);
ajv.addFormat("permission", /.*/);

export async function validateManifest(
  plugin: any,
  manifest: any
): Promise<void> {
  if (typeof manifest !== "object")
    throw Error(`Manifest must be an object, got ${typeof manifest}`);

  const schema = await get(SCHEMA_URL);
  if (!ajv.validate(schema, manifest)) {
    throw Error(
      [
        "Invalid manifest:",
        JSON.stringify(manifest, null, 2),
        JSON.stringify(ajv.errors, null, 2),
      ].join("\n")
    );
  }
}

// Load

const schemaCache: Record<string, any> = {};

function get(url: string): Promise<any> {
  if (schemaCache[url]) return Promise.resolve(schemaCache[url]);

  let resolve: (data: any) => void;
  let reject: (err: unknown) => void;
  const promise = new Promise<any>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  https
    .get(url, (response) => {
      let responseBody = "";
      response.on("data", (chunk) => {
        responseBody += chunk;
      });
      response.on("end", () => {
        resolve(JSON.parse(responseBody));
      });
    })
    .on("error", (err) => reject(err));

  promise.then((schema) => {
    schemaCache[url] = schema;
  });

  return promise;
}
