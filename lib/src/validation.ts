import Ajv from "ajv-draft-04";
import https from "https";

const manifestSchemas: Record<string, string> = {
  "2": "https://json.schemastore.org/chrome-manifest",
};

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

  const manifestVersion = manifest.manifest_version;
  const schemaUrl = manifestSchemas[manifestVersion];
  if (!schemaUrl) {
    plugin.warn(
      `Cannot validate manifest v${manifestVersion}, that version does not have an official schema (supported: ${Object.keys(
        manifestSchemas
      )
        .map((v) => `v${v}`)
        .join(",")})`
    );
    return;
  }
  const schema = await get(schemaUrl);
  if (!ajv.validate(schema, manifest)) {
    throw Error("Invalid manifest: " + JSON.stringify(ajv.errors, null, 2));
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
