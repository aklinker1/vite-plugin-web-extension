import Ajv from "ajv";
import https from "https";

const SCHEMA_URL = "https://json.schemastore.org/chrome-manifest";

// Validate

export async function validateManifest(
  log: typeof console.log,
  manifest: any
): Promise<void> {
  const ajv = new Ajv();
  ajv.addFormat("permission", /.*/);
  ajv.addFormat("content-security-policy", /.*/);
  ajv.addFormat("glob-pattern", /.*/);
  ajv.addFormat("match-pattern", /.*/);
  ajv.addFormat("mime-type", /.*/);

  if (typeof manifest !== "object")
    throw Error(`Manifest must be an object, got ${typeof manifest}`);

  const schema = await get(SCHEMA_URL);
  const data = ajv.validate(schema, manifest);
  if (!data) {
    log(JSON.stringify(manifest, null, 2));
    const errors = (ajv.errors ?? [])
      ?.filter((err) => !!err.instancePath)
      .map(
        (err) =>
          `- manifest${err.instancePath.replace(/\//g, ".")} ${err.message}`
      )
      .join("\n");
    throw Error(`Invalid manifest:\n${errors}`);
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
