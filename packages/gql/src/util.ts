import { upperFirst, snakeCase, toLower } from "lodash";

export const slugify = (string: string) => {
  return toLower(snakeCase(string));
};

export const FMT_BASE = ".forestry/front_matter/templates";
export const shortFMTName = (path: string) => {
  return path.replace(`${FMT_BASE}/`, "").replace(".yml", "");
};

export const friendlyName = (field = "", suffix = "") => {
  if (Array.isArray(field)) {
    const meh = `${field.map((f) => upperFirst(f)).join("_")}${
      suffix && "_" + suffix
    }`;
    return meh;
  } else {
    if (typeof field === "string") {
      if (field) {
        return `${upperFirst(field)}${suffix ? "_" + suffix : ""}`;
      } else {
        return suffix;
      }
    } else {
      return `${
        field.__namespace ? upperFirst(field.__namespace) + "_" : ""
      }${upperFirst(field.name)}${suffix && "_" + suffix}`;
    }
  }
};

export const sequential2 = async (promises: Promise<unknown>[]) => {
  const reducePromises = async (previous: Promise<unknown>, endpoint) => {
    await previous;
    return endpoint;
  };

  return promises.reduce(reducePromises, Promise.resolve());
};

/**
 * Iterate through an array of promises sequentially, ensuring the order
 * is preserved.
 *
 * ```js
 * await sequential(templates, async (template) => {
 *   await doSomething(template)
 * })
 * ```
 */
export const sequential = async <A, B>(
  items: A[],
  callback: (args: A) => Promise<B>
) => {
  const accum: B[] = [];

  const reducePromises = async (previous: Promise<B>, endpoint: A) => {
    const prev = await previous;
    // initial value will be undefined
    if (prev) {
      accum.push(prev);
    }

    return callback(endpoint);
  };

  // @ts-ignore FIXME: this can be properly typed
  accum.push(await items.reduce(reducePromises, Promise.resolve()));

  return accum;
};
