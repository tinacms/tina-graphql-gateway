import { toLower, kebabCase } from "lodash";

export const slugify = (string: string) => {
  return toLower(kebabCase(string));
};
