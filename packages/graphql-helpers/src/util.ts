import camelCase from "lodash.camelcase";
import upperFist from "lodash.upperfirst";

export const FMT_BASE = ".forestry/front_matter/templates";
export const shortFMTName = (path: string) => {
  return path.replace(`${FMT_BASE}/`, "").replace(".yml", "");
};

export const friendlyName = (name: string, options = { suffix: "" }) => {
  const delimiter = "_";

  return upperFist(
    camelCase(
      shortFMTName(name) + (options.suffix && delimiter + options.suffix)
    )
  );
};