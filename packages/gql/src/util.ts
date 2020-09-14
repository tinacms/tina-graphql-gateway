import { upperFirst, camelCase, toLower, kebabCase } from "lodash";

export const slugify = (string: string) => {
  return toLower(kebabCase(string));
};

export const FMT_BASE = ".forestry/front_matter/templates";
export const shortFMTName = (path: string) => {
  return path.replace(`${FMT_BASE}/`, "").replace(".yml", "");
};
export const friendlyName = (name: string, options = { suffix: "" }) => {
  const delimiter = "_";

  return upperFirst(
    camelCase(
      shortFMTName(name) + (options.suffix && delimiter + options.suffix)
    )
  );
};
