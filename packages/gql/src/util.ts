import { upperFirst, snakeCase, camelCase, toLower, kebabCase } from "lodash";

export const slugify = (string: string) => {
  return toLower(kebabCase(string));
};

export const FMT_BASE = ".forestry/front_matter/templates";
export const shortFMTName = (path: string) => {
  return path.replace(`${FMT_BASE}/`, "").replace(".yml", "");
};
const friendlyName2 = (name: string, options = { suffix: "" }) => {
  const delimiter = "_";

  return upperFirst(
    camelCase(
      shortFMTName(name) + (options.suffix && delimiter + options.suffix)
    )
  );
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
      const meh = `${
        field.__namespace ? upperFirst(field.__namespace) + "_" : ""
      }${upperFirst(field.name)}${suffix && "_" + suffix}`;
      return meh;
    }
  }
};
