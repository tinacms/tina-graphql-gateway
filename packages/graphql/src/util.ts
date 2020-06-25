import fs from "fs";
import matterOrig, { Input, GrayMatterOption } from "gray-matter";

export const matter = <I extends Input, O extends GrayMatterOption<I, O>>(
  data: Buffer
) => {
  let res;
  res = matterOrig(data, { excerpt_separator: "<!-- excerpt -->" });

  return res;
};
