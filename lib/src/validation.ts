import Ajv from "ajv";
import manifestSchema from "./manifest-schema.json"

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

  const data = ajv.validate(manifestSchema, manifest);
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

