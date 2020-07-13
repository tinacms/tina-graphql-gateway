import matterOrig, { GrayMatterOption, Input } from "gray-matter";

import { FMT_BASE } from "./schemaBuilder";
import camelCase from "lodash.camelcase";
import upperFist from "lodash.upperfirst";

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
