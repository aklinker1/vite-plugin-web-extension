// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resolveBrowserTagsInObject(
  browser: string | undefined,
  object: any
): any {
  if (Array.isArray(object)) {
    return object
      .map((item) => resolveBrowserTagsInObject(browser, item))
      .filter((item) => !!item);
  } else if (typeof object === "object") {
    return Object.keys(object).reduce((newObject, key) => {
      if (!key.startsWith("{{") || key.startsWith(`{{${browser}}}.`)) {
        // @ts-expect-error: bad key typing
        newObject[key.replace(`{{${browser}}}.`, "")] =
          resolveBrowserTagsInObject(browser, object[key]);
      }
      return newObject;
    }, {});
  } else if (typeof object === "string") {
    if (!object.startsWith("{{") || object.startsWith(`{{${browser}}}.`)) {
      return object.replace(`{{${browser}}}.`, "");
    }
    return undefined;
  } else {
    return object;
  }
}
