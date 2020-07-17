import matterOrig, { GrayMatterOption, Input } from "gray-matter";

import camelCase from "lodash.camelcase";
import kebabCase from "lodash.kebabcase";
import toLower from "lodash.tolower";
import upperFist from "lodash.upperfirst";

// TODO: find the right spot for this
export const FMT_BASE = ".forestry/front_matter/templates";
export const matter = <I extends Input, O extends GrayMatterOption<I, O>>(
  data: Buffer
) => {
  let res;
  res = matterOrig(data, { excerpt_separator: "<!-- excerpt -->" });

  return res;
};

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

export const slugify = (string: string) => {
  return toLower(kebabCase(string));
};
