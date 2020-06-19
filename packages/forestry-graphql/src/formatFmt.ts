import camelCase from "lodash.camelcase";
import upperFist from "lodash.upperfirst";

// turns apple-pie into ApplePie
export const friendlyName = (name: string) => {
  return upperFist(camelCase(name));
};
