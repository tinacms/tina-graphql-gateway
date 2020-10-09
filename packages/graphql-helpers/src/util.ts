import camelCase from "lodash.camelcase";
import upperFirst from "lodash.upperfirst";

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

export const arrayToObject = <T>(
  array: T[],
  func: (accumulator: { [key: string]: any }, item: T) => void
) => {
  const accumulator = {};
  array.forEach((item) => {
    func(accumulator, item);
  });

  return accumulator;
};

export const friendlyName2 = (
  field: { __namespace?: string; name: string } | string | string[] = "",
  suffix = ""
) => {
  if (Array.isArray(field)) {
    const meh = `${field.map((f) => upperFirst(camelCase(f))).join("_")}${
      suffix && "_" + suffix
    }`;
    return meh;
  } else {
    if (typeof field === "string") {
      if (field) {
        return `${upperFirst(camelCase(field))}${suffix ? "_" + suffix : ""}`;
      } else {
        return suffix;
      }
    } else {
      const meh = `${
        field.__namespace ? upperFirst(camelCase(field.__namespace)) + "_" : ""
      }${upperFirst(camelCase(field.name))}${suffix && "_" + suffix}`;
      return meh;
    }
  }
};
